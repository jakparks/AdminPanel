# AdminPanel
#Dependencies:
  Node: v0.12.3
  Compiler: gcc 4.2.1 (some newer versions may work as well, but 4.2.1 is confirmed)
  JDK: 1.7.x
  Python: 2.6.9 or newer
#Instructions to install:

First ensure that node is in your path

Set Environment Variables:
* If using a version of gcc other than system default:
  * Set the following env variables:
    * export CXX=\<path-to-gcc-home\>/bin/g++
    * export LD_LIBRARY_PATH=\<path-to-gcc-home\>/lib64
* If using a version of Python other than system default:
  * Configure node-gyp to use this version:
    * npm config set python=\<path-to-python-home\>
* Confirm that the correct version of Java is in your path:
  * Set the following env variables:
    * export JAVA_HOME=\<path-to-java1.7.x-home\>
    * export PATH=$PATH:/\<path-to-java1.7.x-home\>/bin

* Finally, install all of the modules:
  * Navigate to the top project directory (AdminPanel)
  * Ensure that any existing node_module directory is removed:
    * rm -r node_modules
  * Run:
    * npm install
* If all dependencies built, then installation is complete.

* If you wish to deploy with the forever module:

  * First, ensure that you have the "forever" module installed
    * npm install forever -g
  * Next, open run.sh and set the environment variables to the correct locations.

#Instructions to run:

* You can quickly run the program to test if it works with
  * node server.js
* Deployment On Linux/OSX:
  * You may use the included shell script, run.sh to quickly launch the program with forever.
    * ./run.sh
* You may view and stop running processes with
  * forever list
  * forever stop
  * forever stopall

* In your browser, navigate to
  * \<host-ip\>:3000/adminPanel
