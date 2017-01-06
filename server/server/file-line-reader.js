// Module: FileLineReader
// Constructor: FileLineReader(filename, bufferSize = 8192)
// Methods: hasNextLine() -> boolean
//          nextLine() -> String
//
//
var fs = require("fs");

exports.FileLineReader = function(filename, encoding, bufferSize) {

    if(!bufferSize) {
        bufferSize = 8192;
    }

    //private:
    var currentPositionInFile = 0;
    var buffer = "";
    var fd = fs.openSync(filename, "r");


    // return -1
    // when EOF reached
    // fills buffer with next 8192 or less bytes
    var fillBuffer = function(position) {

        var res = fs.readSync(fd, bufferSize, position, encoding);

        buffer += res[0];
        if (res[1] == 0) {
            return -1;
        }
        return position + res[1];

    };

    currentPositionInFile = fillBuffer(0);

    //public:
    this.hasNextLine = function() {
        while (buffer.indexOf("\n") == -1) {
            currentPositionInFile = fillBuffer(currentPositionInFile);
            if (currentPositionInFile == -1) {
                return false;
            }
        }

        return buffer.indexOf("\n") > -1;
    };

    //public:
    this.nextLine = function() {
        var lineEnd = buffer.indexOf("\n");
        var result = buffer.substring(0, lineEnd);

        buffer = buffer.substring(result.length + 1, buffer.length);
        return result;
    };

    //public:
    this.grabBatch = function(max_lines, lines) {
        var end_reached = false;
        for(var i=0; i < max_lines && !end_reached; i++) {
            end_reached = !this.hasNextLine();
            if(end_reached) {
                return true;
            }
            lines.push(this.nextLine());
        }
        return end_reached;
    };

    return this;
};


