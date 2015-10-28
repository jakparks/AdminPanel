##
#Linux shell script to run using the forever module
##

#Set this to the library of whichever compiler you used to build the modules
export LD_LIBRARY_PATH="/apps/swapps/gcc4/lib64"
#Set this to your node.js binary folder
export PATH="$PATH:/apps/node/bin"

forever start server.js
