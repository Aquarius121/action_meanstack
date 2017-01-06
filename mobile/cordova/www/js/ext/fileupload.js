var hs_gImageURI = '';
var hs_gFileSystem = {};
var hs_fileurl = '';
var hs_entry = '';
var hs_filecallback;
var hs_fileEntry = null;
var hs_metadata = null;
var hs_nativeURL = '';
var hs_name = '';
var hs_tempEntry = null;

var FileIO = {

// sets the filesystem to the global var hs_gFileSystem
    gotFS : function(fileSystem) {
        hs_gFileSystem = fileSystem;
        console.log(fileSystem);
        console.log(hs_gFileSystem);
    },
    b64toBlob : function (b64Data, contentType, sliceSize,writer, fileEntry, callback) {
        FileIO.rotateBase64Image(b64Data,contentType,sliceSize, function(rData){
            contentType = contentType || '';
            sliceSize = sliceSize || 512;

            var byteCharacters = atob(rData.substring(23));
            var byteArrays = [];

            for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                var slice = byteCharacters.slice(offset, offset + sliceSize);

                var byteNumbers = new Array(slice.length);
                for (var i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }

                var byteArray = new Uint8Array(byteNumbers);

                byteArrays.push(byteArray);
            }

            var blob = new Blob(byteArrays, {type: contentType});

            writer.write(blob);
            hs_tempEntry = fileEntry;
            setTimeout(function(){FileIO.updateCameraImages(fileEntry.toURL(),callback)},1000);
        })

    },
    rotateBase64Image : function(base64data,contentType,sliceSize, callback) {
        /*
        contentType = contentType || '';
        sliceSize = sliceSize || 512;

        var byteCharacters = atob(base64data);
        var byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);

            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            var byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

        var blob = new Blob(byteArrays, {type: contentType});

        var canvas = document.getElementById("tempcanvas");
        var ctx = canvas.getContext("2d");

        var image = new Image();


        //image.src = window.URL.createObjectURL(blob)
        */



        var $img = $('<img/>');
        $img.attr('src', "data:image/jpeg;base64,"+base64data);
        $img.css({position: 'absolute', left: '0px', top: '-999999em', maxWidth: 'none', width: '1000px', height: 'auto'});
        $img.bind('load', function() {
            var canvas = document.createElement("canvas");

            var canvasContext = canvas.getContext('2d');
            var imageWidth = $img[0].width;
            var imageHeight = $img[0].height;
            $img.width($img[0].width*0.5);
            $img.height($img[0].height*0.5);

            var canvasWidth = imageWidth;
            var canvasHeight = imageHeight;
            var canvasX = 0;
            var canvasY = 0;

            degree = 90;

            canvasWidth = imageHeight;
            canvasHeight = imageWidth;

            canvasY = imageHeight * (-1);

            canvas.setAttribute('width', canvasWidth);
            canvas.setAttribute('height', canvasHeight);

            canvasContext.rotate(degree * Math.PI / 180);

            canvasContext.drawImage($img[0], canvasX, canvasY);
            callback(canvas.toDataURL("image/jpeg"),0.5);
            //var dataUrl = canvas.toDataURL('image/png');

        });

        /*
        image.src = "data:image/jpeg;base64,"+base64data;

        image.onload = function() {
            //ctx.translate(image.width, image.height);
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.rotate(90 * Math.PI / 180);
            ctx.drawImage(image, 0, 0);

            //window.eval(""+callback+"('"+canvas.toDataURL()+"')");

        };
        */
    },
    fromdataurl : function(data,callback){

        loading_modal.show();
        console.log("show loading");
        hs_gFileSystem.root.getDirectory("temp", {create: true, exclusive: false}, function(dirEntry){
            dirEntry.getFile("temp.jpg", {create: true, exclusive: false}, function(fileEntry){
                fileEntry.createWriter(function(writer){
                    FileIO.b64toBlob(data,"image/jpeg",512,writer,fileEntry,callback);
                    //writer.write(FileIO.b64toBlob(data,"image/jpeg"));

                    //FileIO.updateCameraImages(fileEntry.toURL(),callback);
                },  FileIO.errorHandler);
            }, FileIO.errorHandler);
        }, FileIO.onDirectoryFail);
    },
    updateCameraImages : function(imageURI, func) {
        hs_filecallback = func;
        //hs_gImageURI.push(imageURI);
        window.resolveLocalFileSystemURL(imageURI, FileIO.gotImageURI, FileIO.errorHandler);
    },

// pickup the file hs_entry, rename it, and move the file to the app's root directory.
// on success run the movedImageSuccess() method
    gotImageURI : function(fileEntry) {
        //hs_fileurl.push(fileEntry.toURL());
        //hs_fileurl = fileEntry.toURL();

        hs_entry = fileEntry;
        var directoryEntry = hs_gFileSystem.root;
        console.log(hs_gFileSystem);
        directoryEntry.getDirectory("temp", {create: true, exclusive: false}, FileIO.onDirectorySuccess, FileIO.onDirectoryFail);

    },

    onDirectorySuccess : function(parent) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var j = 0; j < 10; j++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        var newName = "thumbnail"+text+".jpg";
        hs_entry.copyTo(parent, newName, FileIO.movedImageSuccess, FileIO.errorHandler);
        console.log(parent);
        hs_nativeURL = parent.nativeURL;
        hs_name = newName;
    },
    onDirectoryFail : function(error) {
        alert("Unable to create new directory: " + error.code);
    },
// send the full URI of the moved image to the updateImageSrc() method which does some DOM manipulation
    movedImageSuccess : function(fileEntry) {
        //alert(fileEntry.fullPath);
        //alert(fileEntry.toURI());
        //hs_fileurl.push(fileEntry.toURL());
        hs_gImageURI = fileEntry.toURI();
        hs_fileurl = fileEntry.toURL();
        hs_fileEntry = fileEntry;
        hs_entry.file(function(metadata) {
            console.log(metadata);
            console.log(hs_fileurl)
            hs_metadata = metadata;
            hs_metadata.fullPath = hs_fileurl.replace("content://temp",hs_nativeURL);
            hs_metadata.type = "image/jpeg";
            hs_metadata.localURL = hs_fileurl.replace("content://temp",hs_nativeURL);
            hs_metadata.name = hs_name;
            return hs_filecallback();
        });
        hs_tempEntry.remove();

        //DocTypeInfo.set('file', fileEntry.toURL());

        //updateImageSrc(fileEntry.fullPath);
    },

// get a new file hs_entry for the moved image when the user hits the delete button
// pass the file hs_entry to removeFile()
    removeDeletedImage : function(imageURI){
        window.resolveLocalFileSystemURL(imageURI, FileIO.removeFile, FileIO.errorHandler);
    },

// delete the file
    removeFile : function(fileEntry){
        fileEntry.remove();
    },

// simple error handler
    errorHandler : function(e) {
        var msg = '';
        switch (e.code) {
            case FileError.QUOTA_EXCEEDED_ERR:
                msg = 'QUOTA_EXCEEDED_ERR';
                break;
            case FileError.NOT_FOUND_ERR:
                msg = 'NOT_FOUND_ERR';
                break;
            case FileError.SECURITY_ERR:
                msg = 'SECURITY_ERR';
                break;
            case FileError.INVALID_MODIFICATION_ERR:
                msg = 'INVALID_MODIFICATION_ERR';
                break;
            case FileError.INVALID_STATE_ERR:
                msg = 'INVALID_STATE_ERR';
                break;
            default:
                msg = e.code;
                break;
        };
        alert("Error occured");
        console.log('Error: ' + msg);
    }
}