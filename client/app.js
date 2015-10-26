var adminPanel = angular.module("la", ["ngRoute", "ui.bootstrap"]);

var selectedTitle = "";

// This  maps URLS/Routes to pages and controllers
adminPanel.config(["$routeProvider", "$locationProvider", "$httpProvider",
    function($routeProvider, $locationProvider, $httpProvider) {
        $locationProvider.html5Mode(true);
        $routeProvider
            .when("/adminPanel", {
                templateUrl: "/client/templates/home.html",
                controller: "homeController"
            })
            .when("/adminPanel/metrics", {
                templateUrl: "/client/templates/metrics.html",
                controller: "metricsController"
            })
            .when("/adminPanel/configuration/deviceTypes", {
              templateUrl: "/client/templates/deviceTypes.html",
              controller: "deviceTypesController"
            }).when("/adminPanel/configuration/keyValues", {
              templateUrl: "/client/templates/keyValues.html",
              controller: "keyValuesController"
            }).when("/adminPanel/configuration/rssFeeds", {
              templateUrl: "/client/templates/rssFeeds.html",
              controller: "rssFeedController"
            }).when("/adminPanel/configuration/videoChannels", {
              templateUrl: "/client/templates/videoChannels.html",
              controller: "videoChannelsController"
            }).when("/adminPanel/configuration/techZone", {
              templateUrl: "/client/templates/techZone.html",
              controller: "techZoneController"
            }).when("/adminPanel/pilots/pilotApiConfig", {
              templateUrl: "/client/templates/pilotApiConfig.html",
              controller: "pilotApiConfigController"
            }).when("/adminPanel/clientActivityUsage", {
              templateUrl: "/client/templates/clientActivityUsage.html",
              controller: "clientActivityUsageController"
            }).when("/adminPanel/pilots/pilotApiUserConfig", {
              templateUrl: "/client/templates/pilotApiUserConfig.html",
              controller: "pilotApiUserConfigController"
            })
            .otherwise({
                redirectTo: "/"
            });
    }
]);

// This is the main controller that drives the side menu
adminPanel.controller("rootController", function($scope, $http, $location) {
    $scope.isLogin = false;
    if (!$scope.isLogin) {
        var navs = [{
            "name": "Home",
            "url": "/adminPanel",
            "isActive": true
        }, {
          "name": "Configuration",
          "url": "",
          "isActive": false,
          "submenu": [{
            "name": "Device Types",
            "url": "/adminPanel/configuration/deviceTypes",
            "isActive": false
          }, {
            "name": "Key Values",
            "url": "/adminPanel/configuration/keyValues",
            "isActive": false
          }, {
            "name": "RSS Feeds",
            "url": "/adminPanel/configuration/rssFeeds",
            "isActive": false
          }, {
            "name": "Video Channels",
            "url": "/adminPanel/configuration/videoChannels",
            "isActive": false
          }, {
            "name": "TechZone Categories",
            "url": "/adminPanel/configuration/techZone",
            "isActive": false
          }]
        }, {
          "name": "Metrics",
          "url": "",
          "isActive": false,
          "submenu": [{
            "name": "API Use",
            "url": "/adminPanel/metrics?type=apiUse&startIndex=1",
            "isActive": false
          }, {
            "name": "API Use By Day",
            "url": "/adminPanel/metrics?type=apiUseByDay&startIndex=1",
            "isActive": false
          }, {
            "name": "Logins by App Version",
            "url": "/adminPanel/metrics?type=loginsByAppVersion",
            "isActive": false
          }, {
            "name": "Usage by Make/Model",
            "url": "/adminPanel/metrics?type=usageByMakeAndModel",
            "isActive": false
          }, {
            "name": "Usage by App & OS Version",
            "url": "/adminPanel/metrics?type=usageByAppVersionAndOSVersion",
            "isActive": false
          }, {
            "name": "Usage by App Version",
            "url": "/adminPanel/metrics?type=usageByAppVersion",
            "isActive": false
          }, {
            "name": "Usage by OS Version",
            "url": "/adminPanel/metrics?type=usageByOSVersion",
            "isActive": false
          }, {
            "name": "Usage by Day",
            "url": "/adminPanel/metrics?type=usageByDay",
            "isActive": false
          }, {
            "name": "Client Activity Usage",
            "url": "/adminPanel/clientActivityUsage",
            "isActive": false
          }, {
            "name": "Visitors by Day",
            "url": "/adminPanel/metrics?type=visitorsByDay",
            "isActive": false
          }]
        }, {
          "name": "Pilots",
          "url": "",
          "isActive": false,
          "submenu": [
            {
              "name": "Pilot Api Configuration",
              "url": "/adminPanel/pilots/pilotApiConfig",
              "isActive": false
            },
            {
              "name": "Pilot Api User Configuration",
              "url": "/adminPanel/pilots/pilotApiUserConfig",
              "isActive": false
            }
          ]
        }]
        $scope.navs = navs;
    }

    $scope.onNavSwitch = function(nav) {
        _.each($scope.navs, function(nav) {
            nav.isActive = false;
            closeChildren(nav);
        });
        nav.isActive = true;
        selectedTitle = nav.name;
    };

    $scope.onCollapse = function(header) {
      header.collapsed = !header.collapsed;
    }

    // Recursively close every child nav (for multiple nested menus)
    var closeChildren = function(nav) {
      if(nav.submenu) {
        _.each(nav.submenu, function(subnav) {
          subnav.isActive = false;
          closeChildren(subnav);
        })
      } else {
        return;
      }
    }
});

adminPanel.filter('noSpace', function() {
  return function(input) {
    if(input) {
      return input.split(' ').join('-');
    }
  }
});

// This is the home controller
adminPanel.controller("homeController", function($scope, $http) {

  $scope.sqlData = '';
  $scope.testObject = {test1: 5, test2: 10};
  $http.get('/testSQL/' + angular.toJson([$scope.testObject])).then(function(response) {
    $scope.sqlData = response;
  });


});

// This is the metrics controller
adminPanel.controller("metricsController", function($scope, $http, $routeParams) {
  $scope.startIndex = parseInt($routeParams.startIndex);
  $scope.type = $routeParams.type;
  $scope.results;
  $scope.totalRecords;
  $scope.pageSize = 100;
  $scope.active = -1;

  $scope.setActive = function(id) {
    $scope.active = parseInt(id);
  }

  $scope.deleteActive = function() {
    var table;
    if($scope.type == 'apiUse') {
      table = 'METRICS_APIUSE';
    } else if($scope.type == 'apiUseByDay'){
      table = 'METRICS_APIUSEBYDAY';
    }
    $http.get('/edit/deleteItem/' + table + '/' + $scope.active).then(function(response) {
      $scope.active = -1;
      $scope.refresh();
    });
  }

  $scope.refresh = function() {
    $http.get('/metrics/' + $scope.type + '?startIndex=' + $scope.startIndex).then(function(response) {
      if(response && response.data && response.data.result) {
        $scope.totalRecords = response.data.totalRecords;
        $scope.results = response.data.result;
      }
    });
  }

  $scope.refresh();
});

adminPanel.directive("metricsGraph", function() {
  return {
    restrict: 'EA',
    scope: true,
    templateUrl: '/client/templates/graph.html',
    link: function(scope, element, attributes) {
      scope.id = attributes.id;
      scope.$watch(attributes.model, function() {
        if(scope.$eval(attributes.model) != undefined) {
          var graphData = [];
          var results = scope.$eval(attributes.model);

          for(i = 0; i < results.length; i++) {
            graphData.push(parseInt(results[i].VALUE));
          }
          console.log(graphData);
          $(function() {
            $('#' + attributes.id).highcharts({
            chart: {
              backgroundColor: "transparent"
            },
            title: {
              text: attributes.title,
              style: {
                "color": "FFFFFF"
              },
              x: -20
            },
            xAxis: {
              min: 0,
              max: 90
            },
            yAxis: {
              title: {
                text: attributes.dataset
              },
              plotlines: [{
                value: 0,
                width: 1,
                color: '#FFFFFF'
              }]
            },
            series: [{
              name: attributes.dataset,
              data: graphData
            }]
          });
        });
        }
      });
    }
  };
});

adminPanel.directive("callsTable", function() {
  return {
    restrict: 'EA',
    scope: true,
    templateUrl: '/client/templates/callsTable.html',
    link: function(scope, element, attributes) {
      scope.title = attributes.title;
      scope.$watch(attributes.model, function() {
        if(scope.$eval(attributes.model) != undefined) {
          scope.results = scope.$eval(attributes.model);
        }
      });
    }
  };
});

adminPanel.controller("clientActivityUsageController", function($scope, $http, $routeParams) {
  $scope.index = 0;
  $http.get('/metrics/clientActivityUsage').then(function(response) {
    if(response && response.data && response.data.result) {
      $scope.totalRecords = response.data.totalRecords;
      $scope.results = response.data.result;
      $scope.results = groupByName($scope.results);
      console.log($scope.results);

    }
  });
});

adminPanel.controller("deviceTypesController", function($scope, $http, $routeParams) {
  $scope.active = -1;
  $scope.adding = false;
  $scope.editing = false;
  $scope.name;
  $scope.resolution;
  $scope.colorDepth;

  $scope.clearVars = function() {
    $scope.active = -1;
    $scope.adding = false;
    $scope.editing = false;
    $scope.name = "";
    $scope.resolution = "";
    $scope.colorDepth = "";
  }

  $scope.setActive = function(id) {
    $scope.active = parseInt(id);
  }

  $scope.refresh = function() {
    $http.get('/configuration/deviceTypes').then(function(response) {
      if(response && response.data && response.data.result) {
        $scope.totalRecords = response.data.totalRecords;
        $scope.results = response.data.result;
      }
    });
  }

  $scope.deleteActive = function() {
    $http.get('/edit/deleteItem/METRICS_DEVICETYPE/' + $scope.active).then(function(response) {
      $scope.clearVars();
      $scope.refresh();
    });
  }

  $scope.editActive = function() {
    $scope.editing = true;
    $scope.name = $scope.getResult($scope.active).NAME;
    $scope.resolution = $scope.getResult($scope.active).RESOLUTION;
    $scope.colorDepth = $scope.getResult($scope.active).COLORDEPTH;
  }

  $scope.saveEdit = function(id, name, resolution, colorDepth) {
    $http.get('/edit/editDeviceTypes/' + id + '/' + name + '/' + resolution + '/' + colorDepth).then(function(response) {
      $scope.active = -1;
      $scope.refresh();
      $scope.clearVars();
    });
  }

  $scope.addNew = function() {
    $scope.adding = true;
  }

  $scope.save = function(name, resolution, colorDepth) {
    var row = [{name: 'NAME', value: name}, {name: 'RESOLUTION', value: resolution}, {name: 'COLORDEPTH', value: colorDepth}];
    $http.get('/edit/addItem/' + 'METRICS_DEVICETYPE/' + angular.toJson(row)).then(function(response) {
      $scope.refresh();
    });
    $scope.clearVars();
  }

  $scope.cancel = function() {
    $scope.adding = false;
    $scope.clearVars();
  }

  $scope.cancelEdit = function() {
    $scope.clearVars();
  }

  $scope.getResult = function(id) {
    for(i = 0; i < $scope.results.length; i++) {
      if($scope.results[i].ID == id) {
        return $scope.results[i];
      }
    }
  }

  $scope.refresh();
});

adminPanel.controller("keyValuesController", function($scope, $http, $routeParams) {

  $scope.active = -1;
  $scope.adding = false;
  $scope.key;
  $scope.value;
  $scope.isPublic;
  $scope.note;

  $scope.clearVars = function() {
    $scope.active = -1;
    $scope.adding = false;
    $scope.key = "";
    $scope.value = "";
    $scope.isPublic = "";
    $scope.note = "";
  }

  $scope.setActive = function(id) {
    $scope.active = id;
  }

  $scope.deleteActive = function() {
    $http.get('/edit/deleteItem/MMKEYVALUE_KEYVALUE/' + $scope.active).then(function(response) {
      $scope.active = -1;
      $scope.refresh();
      $scope.clearVars();
    });
  }

  $scope.editActive = function() {
    $scope.editing = true;
    $scope.key = $scope.getResult($scope.active).KEY;
    $scope.value = $scope.getResult($scope.active).VALUE;
    $scope.isPublic = $scope.getResult($scope.active).IS_PUBLIC;
    $scope.note = $scope.getResult($scope.active).NOTE;
  }

  $scope.saveEdit = function(id, key, value, isPublic, note) {
    $http.get('/edit/editKeyValues/' + id + '/' + key + '/' + value + '/' + isPublic + '/' + note).then(function(response) {
      $scope.active = -1;
      $scope.refresh();
      $scope.editing = false;
      $scope.clearVars();
    });
  }

  $scope.cancelEdit = function() {
    $scope.editing = false;
    $scope.active = -1;
    $scope.clearVars();
  }

  $scope.addNew = function() {
    $scope.adding = true;
  }

  $scope.save = function(key, value, isPublic, note) {
    var row = [{name: 'KEY', value: key}, {name: 'VALUE', value: value}, {name: 'IS_PUBLIC', value: isPublic}, {name: 'NOTE', value: note}];
    $http.get('/edit/addItem/' + 'MMKEYVALUE_KEYVALUE/' + angular.toJson(row)).then(function(response) {
      $scope.refresh();
      $scope.clearVars();
    });
    $scope.adding = false;
  }

  $scope.cancel = function() {
    $scope.adding = false;
  }

  $scope.refresh = function() {
    $http.get('/configuration/keyValues').then(function(response) {
      if(response && response.data && response.data.result) {
        $scope.totalRecords = response.data.totalRecords;
        $scope.results = response.data.result;
      }
    });
  }

  $scope.getResult = function(id) {
    for(i = 0; i < $scope.results.length; i++) {
      if($scope.results[i].ID == id) {
        return $scope.results[i];
      }
    }
  }

  $scope.refresh();
});

adminPanel.controller("rssFeedController", function($scope, $http, $routeParams) {

  $scope.active = -1;
  $scope.adding = false;
  $scope.group;
  $scope.name;
  $scope.url;
  $scope.loginRequired;
  $scope.lastContentDate;

  $scope.clearVars = function() {
    $scope.active = -1;
    $scope.adding = false;
    $scope.group = "";
    $scope.name = "";
    $scope.url = "";
    $scope.loginRequired = "";
    $scope.lastContentDate = "";
  }

  $scope.setActive = function(id) {
    $scope.active = id;
  }

  $scope.deleteActive = function() {
      $http.get('/edit/deleteItem/RSSFEED_RSSFEED/' + $scope.active).then(function(response) {
        $scope.active = -1;
        $scope.refresh();
      });
  }

  $scope.editActive = function() {
    $scope.editing = true;
    $scope.group = $scope.getResult($scope.active).GROUP;
    $scope.name = $scope.getResult($scope.active).NAME;
    $scope.url = $scope.getResult($scope.active).URL;
    $scope.loginRequired = $scope.getResult($scope.active).LOGIN_REQUIRED;
    $scope.lastContentDate = $scope.getResult($scope.active).LAST_CONTENT_DATE;
  }

  $scope.saveEdit = function(id, group, name, url, loginRequired) {
    $http.get('/edit/editRssFeed/' + id + '/' + group + '/' + name + '/' + url + '/' + loginRequired).then(function(response) {
      $scope.active = -1;
      $scope.refresh();
      $scope.editing = false;
      $scope.clearVars();
    });
  }

  $scope.cancelEdit = function() {
    $scope.active = -1;
    $scope.editing = false;
    $scope.clearVars();
  }

  $scope.addNew = function() {
    $scope.adding = true;
  }

  $scope.save = function(group, name, url, loginRequired) {
    $http.get('/edit/addRssFeed/' + group + '/' + name + '/' + url + '/' + loginRequired).then(function(response) {
      $scope.refresh();
      $scope.clearVars();
    });
    $scope.adding = false;
  }

  $scope.cancel = function() {
    $scope.adding = false;
    $scope.clearVars();
  }

  $scope.refresh = function() {
    $http.get('/configuration/rssFeeds').then(function(response) {
      if(response && response.data && response.data.result) {
        $scope.totalRecords = response.data.totalRecords;
        $scope.results = response.data.result;
      }
    });
  }

  $scope.getResult = function(id) {
    for(i = 0; i < $scope.results.length; i++) {
      if($scope.results[i].ID == id) {
        return $scope.results[i];
      }
    }
  }

  $scope.refresh();
});

adminPanel.controller("videoChannelsController", function($scope, $http, $routeParams) {

  $scope.active = -1;
  $scope.name;
  $scope.url;
  $scope.author;
  $scope.searchFlag;
  $scope.lastContentDate;

  $scope.clearVars = function() {
    $scope.active = -1;
    $scope.name = "";
    $scope.url = "";
    $scope.author = "";
    $scope.searchFlag = "";
    $scope.lastContentDate = "";
  }

  $scope.setActive = function(id) {
    $scope.active = id;
  }

  $scope.deleteActive = function() {
    $http.get('/edit/deleteItem/VIDEO_CHANNELS/' + $scope.active).then(function(response) {
      $scope.active = -1;
      $scope.refresh();
    });
  }

  $scope.editActive = function() {
    $scope.editing = true;
    $scope.name = $scope.getResult($scope.active).NAME;
    $scope.url = $scope.getResult($scope.active).URL;
    $scope.author = $scope.getResult($scope.active).AUTHOR;
    $scope.searchFlag = $scope.getResult($scope.active).SEARCHFLAG;
    $scope.lastContentDate = $scope.getResult($scope.active).LAST_CONTENT_DATE;
  }

  $scope.saveEdit = function(id, name, url, author, searchFlag) {
    $http.get('/edit/editVideoChannel/' + id + '/' + name + '/' + url + '/' + author + '/' + searchFlag).then(function(response) {
      $scope.active = -1;
      $scope.refresh();
      $scope.editing = false;
      $scope.clearVars();
    });
  }

  $scope.cancelEdit = function() {
    $scope.active = -1;
    $scope.editing = false;
    $scope.clearVars();
  }

  $scope.addNew = function() {
    $scope.adding = true;
  }

  $scope.save = function(name, url, author, searchFlag) {
    $http.get('/edit/addVideoChannel/' + name + '/' + url + '/' + author + '/' + searchFlag).then(function(response) {
      $scope.refresh();
      $scope.clearVars();
    });
    $scope.adding = false;
  }

  $scope.cancel = function() {
    $scope.adding = false;
    $scope.clearVars();
  }

  $scope.refresh = function() {
    $http.get('/configuration/videoChannels').then(function(response) {
      if(response && response.data && response.data.result) {
        $scope.totalRecords = response.data.totalRecords;
        $scope.results = response.data.result;
      }
    });
  }

  $scope.getResult = function(id) {
    for(i = 0; i < $scope.results.length; i++) {
      if($scope.results[i].ID == id) {
        return $scope.results[i];
      }
    }
  }

  $scope.refresh();
});

adminPanel.controller("techZoneController", function($scope, $http, $routeParams) {

  $scope.active = -1;
  $scope.name;

  $scope.setActive = function(id) {
    $scope.active = id;
  }

  $scope.deleteActive = function() {
    $http.get('/edit/deleteItem/TECHZONE_CATEGORIES/' + $scope.active).then(function(response) {
      $scope.active = -1;
      $scope.refresh();
    });
  }

  $scope.addNew = function() {
    $scope.adding = true;
  }

  $scope.save = function(name) {
    $http.get('/edit/addTechZone/' + name).then(function(response) {
      $scope.refresh();
    });
    $scope.adding = false;
  }

  $scope.cancel = function() {
    $scope.adding = false;
  }

  $scope.refresh = function() {
    $http.get('/configuration/techZone').then(function(response) {
      if(response && response.data && response.data.result) {
        $scope.totalRecords = response.data.totalRecords;
        $scope.results = response.data.result;
      }
    });
  }

  $scope.refresh();
});

adminPanel.controller("pilotApiConfigController", function($scope, $http, $routeParams) {
  $scope.active = -1;
  $scope.name;
  $scope.description;

  $scope.setActive = function(id) {
    $scope.active = id;
  }

  $scope.deleteActive = function() {
    $http.get('/edit/deleteItem/PILOT_API/' + $scope.active).then(function(response) {
      $scope.active = -1;
      $scope.refresh();
    });
  }

  $scope.addNew = function() {
    $scope.adding = true;
  }

  $scope.save = function(name, description) {
    $http.get('/edit/addPilot?name=' + name + '&description=' + description).then(function(response) {
      $scope.refresh();
    });
    $scope.adding = false;
  }

  $scope.cancel = function() {
    $scope.adding = false;
  }

  $scope.refresh = function() {
    $http.get('/pilots/pilotApiConfig').then(function(response) {
      if(response && response.data && response.data.result) {
        $scope.totalRecords = response.data.totalRecords;
        $scope.results = response.data.result;
      }
    });
  }

  $scope.refresh();

});

adminPanel.controller("pilotApiUserConfigController", function($scope, $http, $routeParams) {
  $scope.selection = {
    id: null
  };
  $scope.apis;
  $scope.results;
  $scope.active = -1;
  $scope.addId;
  $scope.ccoid;

  $scope.setActive = function(id) {
    $scope.active = id;
  }

  $scope.deleteActive = function() {
    $http.get('/edit/deleteItem/PILOT_API_USERS/' + $scope.active).then(function(response) {
      $scope.active = -1;
      $scope.getResults();
    });
  }

  $scope.addNew = function() {
    $scope.adding = true;
  }

  $scope.cancel = function() {
    $scope.adding = false;
  }

  $scope.save = function(pilotApiId, CCOId) {
    $http.get('/edit/addPilotUser?id=' + pilotApiId + '&CCOId=' + CCOId).then(function(response) {
      $scope.getResults();
    });
    $scope.adding = false;
  }

  $scope.getAllApis = function() {
    $http.get('/pilots/pilotApiConfig/').then(function(response) {
      if(response && response.data && response.data.result) {
        $scope.apis = response.data.result;
      }
    });
  }

  $scope.getResults = function() {
    $http.get('/pilots/pilotApiUserConfig/' + $scope.selection.id).then(function(response) {
      if(response && response.data && response.data.result) {
        $scope.results = response.data.result;
      }
    })
  }

  $scope.$watch('selection.id', function() {
    $scope.getResults();
  });

  $scope.getAllApis();
});

function groupByName(list) {
  var groups = {};
  list.forEach(function(o) {
    var group = o.NAME1;
    groups[group] = groups[group] || [];
    groups[group].push(o);
  });
  return groups;
}
