// Variables
var express = require('express'),
    methodOverride = require('method-override'),
    morgan = require('morgan'),
    http = require('http'),
    path = require('path'),
    fs = require('fs'),
    propsReader = require('properties-reader'),
    port = 3000,
    server = express(),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    DEFAULT_PORT = 3000,
    DEFAULT_THEME = "superhero",
    DEFAULT_AVATAR = "http://www.lezebre.lu/images/21913-scooby-doo-mystery-machine-fleur.png",
    bb = require("bluebird"),
    log4js = require("log4js"),
    bodyParser = require("body-parser"),
    jdbc = new ( require("jdbc") ),
    config = require('./configuration');

var basicAuth = require('basic-auth-connect');
server.use(basicAuth(config.user, config.password));

// Configure Logging including mogran for all HTTP requests
log4js.configure({
    appenders: [
        { type: 'file', filename: '/apps/var/log/nodejs/admin.log', category: 'adminPanel', 'maxLogSize': 1000000, 'backups': 10 }
    ]
});
log4js.replaceConsole();
var logger = log4js.getLogger('adminPanel');
var theHTTPLog = morgan("tiny", {
  "stream": {
    write: function(str) { logger.info(str); }
  }
});
server.use(theHTTPLog);

// Server setup
server.use(bodyParser.json());
server.use("/bower_components", express.static(__dirname + "/client/bower_components")); // Treat all bower_components requests as static content
server.use("/adminPanel*", function(req, res, next) { // Send these request to the main index.html to be routed by Angular
    res.sendFile(__dirname + "/index.html");
});
server.use("/client", express.static(__dirname + "/client")); // Treat all client requests as static content
server.use(function(req, res, next) {
    next();
});

//jdbc setup
var jdbcConfig = {
  libpath: './db/ojdbc14.jar',
  libs: [],
  drivername: 'oracle.jdbc.driver.OracleDriver',
  url: 'jdbc:oracle:thin:@lnxdb-dev-vm-241.cisco.com:1524:AS1DEV',
  user: config.user,
  password: config.password
};

jdbc.initialize(jdbcConfig, function(err, res) {
  if(err) {
    logger.info(err);
  } else {
    logger.info("JDBC config success");
  }
});



// Global values
// Page size
var PAGE_SIZE = 100;

server.listen(DEFAULT_PORT, function() {
  logger.info("Server listening");
})
// ********************************** common routines start here ***********************************************


function writeResponse(res, status, result) {
   var response = {
       "status": status,
       "result": result
   };
   logger.info("Response to client: " + JSON.stringify(response));
   res.writeHead(200, {
       'Content-Type': 'application/json'
   });
   res.write(JSON.stringify(response));
   res.end();
}

function writeResponse(res, status, result, cnt, startIndex, numRecords) {
   var response = {
       "status": status,
       "result": result,
       "totalRecords" : cnt,
       "startIndex" : startIndex,
       "pageSize" : PAGE_SIZE,
       "numRecords" : numRecords
   };
   logger.info("Response to client: " + JSON.stringify(response));
   res.writeHead(200, {
       'Content-Type': 'application/json'
   });
   res.write(JSON.stringify(response));
   res.end();
}


// ********************************** routes start here ***********************************************

var closeConn = function() {
  jdbc.close(function(err) {
    if(err) {
      logger.info(err);
    } else {
      logger.info("Connection closed successfully!");
    }
  });
}

//Route to get METRICS_APIUSE table
server.get('/metrics/apiUse', function(req, res) {
    var startIndex = parseInt(req.query.startIndex);
    var count = -1;
    jdbc.open(function(err, conn) {
      if(conn) {
        //Get the total count of records first.
        jdbc.executeQuery("SELECT COUNT(*) AS count FROM METRICS_APIUSE", function(err, result) {
          count = result[0].COUNT;
          //Get a range of records of size PAGE_SIZE, ordered by timestamp descending
          jdbc.executeQuery("SELECT * FROM (SELECT m.*, ROWNUM r FROM (SELECT * FROM METRICS_APIUSE ORDER BY TS DESC) m) WHERE r >= " + startIndex + " AND r < " + (startIndex + PAGE_SIZE), function(err, result) {
            if(err) {
              logger.info(err);
            } else {
              logger.info("Fetched APIUSE");
              writeResponse(res, 'success', result, count, startIndex, result.length);
              closeConn();
            }
          });
        });
      } else {
        logger.info("No connection!");
      }
    });
});

//Route to get METRICS_APIUSEBYDAY table
server.get('/metrics/apiUseByDay', function(req, res) {
  var startIndex = parseInt(req.query.startIndex);
  var count = -1;
  jdbc.open(function(err, conn) {
    if(conn) {
      //Get the total count of records first.
      jdbc.executeQuery("SELECT COUNT(*) AS count FROM METRICS_APIUSEBYDAY", function(err, result) {
        count = result[0].COUNT;
        //Get a range of records of size PAGE_SIZE, ordered by day descending
        jdbc.executeQuery("SELECT * FROM (SELECT m.*, ROWNUM r FROM (SELECT * FROM METRICS_APIUSEBYDAY ORDER BY DAY DESC) m) WHERE r >= " + startIndex + " AND r < " + (startIndex + PAGE_SIZE), function(err, result) {
          if(err) {
            logger.info(err);
          } else {
            logger.info("Fetched APIUSEBYDAY");
            writeResponse(res, 'success', result, count, startIndex, result.length);
            closeConn();
          }
        });
      });
    } else {
      logger.info("No connection!");
    }
  });
});

server.get('/metrics/loginsByAppVersion', function(req, res) {
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeQuery("select appname as name1, appversion as name2, count(*) as value from api_device where mod_date >= sysdate - 30 group by appname, appversion order by lower(appname), appversion", function(err, result) {
        if(err) {
          logger.info(err);
        } else {
          logger.info("Fetched logins by app version (from API_DEVICE).")
          writeResponse(res, 'success', result, -1, -1, result.length);
          closeConn();
        }
      });
    } else {
      logger.info("No connection!");
    }
  })
})

server.get('/metrics/usageByMakeAndModel', function(req, res) {
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeQuery("select mm.make as name1, mm.model as name2, count(*) as value from metrics_apiuse ma, metrics_mfginfo mm where ma.ts >= sysdate - 30 and ma.mfginfo_id = mm.id group by mm.make, mm.model order by 3 desc", function(err, result) {
        if(err) {
          logger.info(err);
        } else {
          logger.info("Fetched usage by make and model.");
          writeResponse(res, 'success', result, -1, -1, result.length);
          closeConn();
        }
      });
    } else {
      logger.info("No connection!");
    }
  })
});

server.get('/metrics/usageByAppVersionAndOSVersion', function(req, res) {
  var finalResult = {};
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeQuery("select appname as name1, appversion as name2, osversion as name3, count(osversion) as value from metrics_apiuse where ts >= sysdate - 30 and devicetype_id in (5,6,7) group by appname, appversion, osversion order by 1, 2,3", function(err, result) {
        finalResult.ios = result;
        jdbc.executeQuery("select appname as name1, appversion as name2, osversion as name3, count(osversion) as value from metrics_apiuse where ts >= sysdate - 30 and devicetype_id in (8) group by appname, appversion, osversion order by 1, 2,3", function(err, result) {
          finalResult.android = result;
          jdbc.executeQuery("select t.name as name1,  appname as name2, appversion as name3, osversion as name4, count(osversion) as value from metrics_apiuse, metrics_devicetype t where t.id=devicetype_id and ts >= sysdate - 30 and devicetype_id not in (5, 6, 7, 8) group by t.name, appname, appversion, osversion order by 1, 2,3,4", function(err, result) {
            finalResult.other = result;
            logger.info("Fetched usage by app version and os version.");
            writeResponse(res, 'success', finalResult, -1, -1, -1);
            closeConn();
          });
        });
      });
    } else {
      logger.info("No connection!");
    }
  });
});

server.get('/metrics/usageByAppVersion', function(req, res) {
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeQuery("select  appname as name1, appversion as name2, count(*) as value from metrics_apiuse where ts >= sysdate - 30 group by appname, appversion order by lower(appname), appversion", function(err, result) {
        logger.info("Fetched usage by app version.");
        writeResponse(res, 'success', result, -1, -1, result.length);
        closeConn();
      });
    } else {
      logger.info("No connection!");
    }
  })
});

server.get('/metrics/usageByOSVersion', function(req, res) {
  var finalResult = {};
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeQuery("select osversion as name1, count(*) as value from metrics_apiuse where ts >= sysdate - 30 and devicetype_id in (5,6,7) group by osversion order by 2 desc", function(err, result) {
        finalResult.ios = result;
        jdbc.executeQuery("select osversion as name1, count(*) as value from metrics_apiuse where ts >= sysdate - 30 and devicetype_id in (8) group by osversion order by 2 desc", function(err, result) {
          finalResult.android = result;
          jdbc.executeQuery("select osversion as name1, count(*) as value from metrics_apiuse where ts >= sysdate - 30 and devicetype_id not in (5,6,7,8) group by osversion order by 2 desc", function(err, result) {
            finalResult.other = result;
            logger.info("Fetched usage by OS version.");
            writeResponse(res, 'success', finalResult, -1, -1, -1);
            closeConn();
          });
        });
      });
    } else {
      logger.info("No connection!");
    }
  });
});

server.get('/metrics/usageByDay', function(req, res) {
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeQuery("select to_char(ts, 'YYYY-MM-DD') as name1, count(*) as value from metrics_apiuse where ts >= sysdate - 90 group by to_char(ts, 'YYYY-MM-DD') order by 1", function(err, result) {
        if(err) {
          logger.info(err);
        } else {
          logger.info("Fetched usage by day.");
          writeResponse(res, 'success', result, -1, -1, result.length);
          closeConn();
        }
      });
    } else {
      logger.info("No connection!");
    }
  });
});

server.get('/metrics/visitorsByDay', function(req, res) {
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeQuery("select mday as name1, count(*) as value from (select  distinct(deviceid), to_char(ts, 'YYYY-MM-DD') as mday from metrics_apiuse where ts >= sysdate - 90) group by mday order by mday", function(err, result) {
        if(err) {
          logger.info(err);
        } else {
          logger.info("Fetched visitors by day.");
          writeResponse(res, 'success', result, -1, -1, result.length);
          closeConn();
        }
      });
    } else {
      logger.info("No connection!");
    }
  });
});

server.get('/metrics/clientActivityUsage', function(req, res) {
  jdbc.open(function(err, conn) {
    if(conn) {
        jdbc.executeQuery("select area as name1, day as name2, count as value from metrics_apiusebyday where day >= sysdate - 90 and area like 'client activity %' order by 1,2", function(err, result) {
          if(err) {
            logger.info(err);
          } else {
            logger.info("Fetched clent activity calls last 90 days");
            writeResponse(res, 'success', result, -1, -1, result.length);
            closeConn();
          }
        });
    } else {
      logger.info("No connection!");
    }
  });
});

server.get('/configuration/deviceTypes', function(req, res) {
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeQuery("SELECT * FROM METRICS_DEVICETYPE ORDER BY name ASC", function(err, result) {
        if(err) {
          logger.info(err);
        } else {
          logger.info("Fetched device types");
          writeResponse(res, 'success', result, -1, -1, result.length);
          closeConn();
        }
      });
    } else {
      logger.info("No connection!");
    }
  });
});

server.get('/configuration/keyValues', function(req, res) {
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeQuery("SELECT * FROM MMKEYVALUE_KEYVALUE ORDER BY key ASC", function(err, result) {
        if(err) {
          logger.info(err);
        } else {
          logger.info("Fetched key values");
          writeResponse(res, 'success', result, -1, -1, result.length);
          closeConn();
        }
      });
    } else {
      logger.info("No connection!");
    }
  });
});

function reformatDateString(dbString) {
  var months = [];
  months[0] = ('Jan');
  months[1] = ('Feb');
  months[2] = ('Mar');
  months[3] = ('Apr');
  months[4] = ('May');
  months[5] = ('Jun');
  months[6] = ('Jul');
  months[7] = ('Aug');
  months[8] = ('Sep');
  months[9] = ('Oct');
  months[10] = ('Nov');
  months[11] = ('Dec');
  var re = /\d\d\d\d-\d\d?-\d\d? [0-9\.]* GMT/;
  if(!dbString.match(re)) {
    return '';
  } else {
    var dateSplit = dbString.split('-');
    var year = dateSplit[0];
    var month = dateSplit[1];
    var day = dateSplit[2].split(' ')[0];
    var time = dateSplit[2].split(' ')[1];

    return day + '-' + months[month - 1] + '-' + year.substring(2) + ' ' + time + ' -0000';
  }
}

server.get('/configuration/rssFeeds', function(req, res) {
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeQuery("SELECT * FROM RSSFEED_RSSFEED ORDER BY \"GROUP\"", function(err, result) {
        if(err) {
          logger.info(err);
        } else {
          logger.info("Fetched rss feeds");
          for(i = 0; i < result.length; i++) {
            result[i].LAST_CONTENT_DATE = reformatDateString(result[i].LAST_CONTENT_DATE);
          }
          writeResponse(res, 'success', result, -1, -1, result.length);
          closeConn();
        }
      });
    } else {
      logger.info("No connection!");
    }
  });
});

server.get('/configuration/videoChannels', function(req, res) {
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeQuery("SELECT * FROM VIDEO_CHANNELS", function(err, result) {
        if(err) {
          logger.info(err);
        } else {
          logger.info("Fetched video channels");
          for(i = 0; i < result.length; i++) {
            result[i].LAST_CONTENT_DATE = reformatDateString(result[i].LAST_CONTENT_DATE);
          }
          writeResponse(res, 'success', result, -1, -1, result.length);
          closeConn();
        }
      });
    } else {
      logger.info("No connection!");
    }
  });
});

server.get('/configuration/techZone', function(req, res) {
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeQuery("SELECT * FROM TECHZONE_CATEGORIES ORDER BY NAME", function(err, result) {
        if(err) {
          logger.info(err);
        } else {
          logger.info("Fetched techzone categories");
          for(i = 0; i < result.length; i++) {
            result[i].LAST_CONTENT_DATE = reformatDateString(result[i].LAST_CONTENT_DATE);
          }
          writeResponse(res, 'success', result, -1, -1, result.length);
          closeConn();
        }
      });
    } else {
      logger.info("No connection!");
    }
  });
});

server.get('/pilots/pilotApiConfig', function(req, res) {
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeQuery("SELECT * FROM PILOT_API", function(err, result) {
        if(err) {
          logger.info(err);
        } else {
          logger.info("Fetched pilot api configurations");
          writeResponse(res, 'success', result, -1, -1, result.length);
          closeConn();
        }
      });
    }
  });
});

server.get('/pilots/pilotApiUserConfig/:id', function(req, res) {
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeQuery("SELECT ID as NAME1, PILOT_API_ID as NAME2, CCO_ID as VALUE FROM PILOT_API_USERS WHERE PILOT_API_ID = " + req.params.id, function(err, result) {
        if(err) {
          logger.info(err);
        } else {
          logger.info("Fetched pilot api configuration users");
          writeResponse(res, 'success', result, -1, -1, result.length);
        }
      })
    } else {
      logger.info("No connection!");
    }
  });
});

server.get('/edit/deleteItem/:table/:id', function(req, res) {
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeUpdate("DELETE " + req.params.table + " WHERE ID = " + req.params.id, function(err, num_rows) {
        if(err) {
          logger.info(err);
        } else {
          logger.info("Deleted from table " + req.params.id + " item with ID " + req.params.id);
          writeResponse(res, 'success', num_rows);
          closeConn();
        }
      });
    } else {
      logger.info("No connection!");
    }
  });
});

server.get('/edit/addRssFeed/:group/:name/:href(*)/:loginRequired/', function(req, res) {
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeUpdate("INSERT INTO RSSFEED_RSSFEED VALUES (null, " + enquote(req.params.name) + ", " + enquote(req.params.group) + ", " + enquote(req.params.href) + ", " + enquote(req.params.loginRequired) + ", " + "SYSDATE" + ")", function(err, num_rows) {
        if(err) {
          logger.info(err);
        } else {
          logger.info("Added into RSSFEED_RSSFEED");
          writeResponse(res, 'success', num_rows);
          closeConn();
        }
      });
    } else {
      logger.info("No connection!");
    }
  });
});

server.get('/edit/addPilot/', function(req, res) {
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeUpdate("INSERT INTO PILOT_API VALUES (null, " + enquote(req.query.name) + ", " + enquote(req.query.description) + ", null)", function(err, num_rows) {
        if(err) {
          logger.info(err);
        } else {
          logger.info("Added into PILOT_API");
          writeResponse(res, 'success', num_rows);
          closeConn();
        }
      });
    } else {
      logger.info("No connection!");
    }
  });
});

server.get('/edit/addPilotUser', function(req, res) {
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeUpdate("INSERT INTO PILOT_API_USERS VALUES (null, " + enquote(req.query.id) + ", " + enquote(req.query.CCOId) + ", null)", function(err, num_rows) {
        if(err) {
          logger.info(err);
        } else {
          logger.info("Added into PILOT_API_USERS");
          writeResponse(res, 'success', num_rows);
          closeConn();
        }
      })
    } else {
      logger.info("No connection!");
    }
  });
});

server.get('/edit/addVideoChannel/:name/:href(*)/:author/:searchFlag/', function(req, res) {
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeUpdate("INSERT INTO VIDEO_CHANNELS VALUES (null, " + enquote(req.params.name) + ", " + enquote(req.params.href) + ", " + enquote(req.params.searchFlag) + ", " + enquote(req.params.author) + ", " + "SYSDATE" + ")", function(err, num_rows) {
        if(err) {
          logger.info(err);
        } else {
          logger.info("Added into VIDEO_CHANNELS");
          writeResponse(res, 'success', num_rows);
          closeConn();
        }
      });
    } else {
      logger.info("No connection!");
    }
  });
});

server.get('/edit/editDeviceTypes/:id/:name/:resolution/:colorDepth', function(req, res) {
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeUpdate("UPDATE METRICS_DEVICETYPE SET NAME=" + enquote(req.params.name) + ", " + "RESOLUTION=" + enquote(req.params.resolution) + ", " + "COLORDEPTH=" + enquote(req.params.colorDepth) + "WHERE ID=" + enquote(req.params.id) , function(err, num_rows) {
        if(err) {
          logger.info(err);
        } else {
          logger.info("Edited device type");
          writeResponse(res, 'success', num_rows);
          closeConn();
        }
      });
    } else {
      logger.info("No connection!");
    }
  });
});

server.get('/edit/editKeyValues/:id/:key/:value(*)/:isPublic/:note', function(req, res) {
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeUpdate("UPDATE MMKEYVALUE_KEYVALUE SET KEY=" + enquote(req.params.key) + ", " + "VALUE=" + enquote(req.params.value) + ", " + "IS_PUBLIC=" + enquote(req.params.isPublic) + ", " + "NOTE=" + enquote(req.params.note) + " WHERE ID=" + enquote(req.params.id), function(err, num_rows) {
        if(err) {
          logger.info(err);
        } else {
          logger.info("Edited keyValue");
          writeResponse(res, 'success', num_rows);
          closeConn();
        }
      });
    } else {
      logger.info("No connection!");
    }
  });
});

server.get('/edit/editRssFeed/:id/:group/:name/:href(*)/:loginRequired', function(req, res) {
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeUpdate("UPDATE RSSFEED_RSSFEED SET \"GROUP\"=" + enquote(req.params.group) + ", " + "NAME=" + enquote(req.params.name) + ", " + "URL=" + enquote(req.params.href) + ", " + "LOGIN_REQUIRED=" + enquote(req.params.loginRequired) + " WHERE ID=" + enquote(req.params.id), function(err, num_rows) {
        if(err) {
          logger.info(err);
        } else {
          logger.info("Edited rssfeeds");
          writeResponse(res, 'success', num_rows);
          closeConn();
        }
      });
    } else {
      logger.info("No connection!");
    }
  });
});

server.get('/edit/editVideoChannel/:id/:name/:href(*)/:author/:searchFlag', function(req, res) {
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeUpdate("UPDATE VIDEO_CHANNELS SET NAME=" + enquote(req.params.name) + ", " + "URL=" + enquote(req.params.href) + ", " + "AUTHOR=" + enquote(req.params.author) + ", " + "SEARCHFLAG=" + enquote(req.params.searchFlag) + " WHERE ID=" + enquote(req.params.id), function(err, num_rows) {
        if(err) {
          logger.info(err);
        } else {
          logger.info("Edited video channel");
          writeResponse(res, 'success', num_rows);
          closeConn();
        }
      });
    } else {
      logger.info("No connection!");
    }
  });
});

/* Route to add a row to a table
Param table: the table name, a string
Param row: an array of objects containing the names of each column and their values. Expected format is as follows:

[col1, col2, ...]

and for example col1 could be

{name: RESOLUTION, value: '300x300'}
etc.
*/
server.get('/edit/addItem/:table/:row', function(req, res) {
  var row = JSON.parse(req.params.row);
  var updateString = 'INSERT INTO ' + req.params.table + ' (ID,';
  for(i = 0; i < row.length; i++) {
    if(i == row.length - 1) {
      updateString += row[i].name;
    } else {
      updateString += row[i].name + ',';
    }
  }
  updateString += ') VALUES (null,';
  for(i = 0; i < row.length; i++) {
    if(i == row.length - 1) {
      updateString += "'" + row[i].value + "'";
    } else {
      updateString += "'" + row[i].value + "'" + ',';
    }
  }
  updateString += ')';
  logger.info(updateString);
  jdbc.open(function(err, conn) {
    if(conn) {
      jdbc.executeUpdate(updateString, function(err, num_rows) {
        logger.info('Added new row to table ' + req.params.table);
        writeResponse(res, 'success', num_rows);
        closeConn();
      });
    } else {
      logger.info("No connection!");
    }
  });
});


function enquote(s) {
  return "'" + s + "'";
}
