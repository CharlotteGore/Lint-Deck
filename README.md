I needed something to continuously scan my javascript files and run them through JSlint whenever they changed. Using Ruby gems with Rhino was slow and painful, so I wrote this little Node.js based web app.

Assuming you already have node installed, clone this repo somewhere then do a 'node lint-deck.js' which will start recursively looking for javascript files from your current location, or you can pass it a path, and it'll start from there instead. It'll only include directories that actually contain javascript files.

Once it's running point your browser at 127.0.0.1:8001, and that's it. By default all modules are disabled, you simply click "enable monitoring" to begin.

This is still very rough and ready atm, made worse by developing on the new (but unstable) node.exe. Your milage, etc.