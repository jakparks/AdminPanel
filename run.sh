##
#Linux shell script to run using the forever module
##

#Set this to the library of whichever compiler you used to build the modules
export LD_LIBRARY_PATH="/apps/swapps/gcc4/lib64"
#Set this to your node.js binary folder
export PATH="$PATH:/apps/node/bin"
#This is the username to access the panel.  This user should be authorized to see/edit the DB
export ADMIN_USER="EXAMPLE_USER"
#Password for above user
export ADMIN_PASS="EXAMPLE_PASS"

forever start server.js
