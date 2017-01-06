var barcode_decode = (function() {

    var _decoderWorker = "/js/tpl/barcode/decoder-worker-raw-uncompressed.js";

    function decode(usesWorkers, selector, onSuccess, onFailure) {
        var c=document.createElement("canvas");
        var ctx=c.getContext("2d");
        var img = $(selector)[0];

        c.height=480;
        c.width=640;

        ctx.drawImage(img,0,0,c.width,c.height);

        decodeCanvas(usesWorkers, ctx, onSuccess, onFailure);
    }

    function decodeImg(usesWorkers, img, onSuccess, onFailure) {
        var c=document.createElement("canvas");
        var ctx=c.getContext("2d");

        c.height=480;
        c.width=640;

        ctx.drawImage(img,0,0,c.width,c.height);

        decodeCanvas(usesWorkers, c, onSuccess, onFailure);
    }

    function decodeCanvas(usesWorkers, canvas, onSuccess, onFailure) {
        var ctx=canvas.getContext("2d");

        var workerCount = 0, successCount = 0;

        function receiveMessage(e) {
            if(e.data.success === "log") {
                console.log(e.data.result);
                return;
            }
            workerCount--;
            if(e.data.success) {
                successCount++;
                onSuccess(e.data.result);
                workerCount = 0;
                return;
            } else {
                if(workerCount > 0) {
                    RunNextWorker();
                    return;
                }
            }
            if(workerCount == 0 && successCount == 0){
                onFailure();
            }
        }

        var DecodeWorker = new Worker(_decoderWorker);
        var FlipWorker = new Worker(_decoderWorker);
        var RightWorker = new Worker(_decoderWorker);
        var FlipWorker2 = new Worker(_decoderWorker);
        DecodeWorker.onmessage = receiveMessage;
        FlipWorker.onmessage = receiveMessage;
        RightWorker.onmessage = receiveMessage;
        FlipWorker2.onmessage = receiveMessage;
        var workerContexts = [
            {worker: DecodeWorker, cmd: 'normal'},
            {worker: FlipWorker, cmd: 'flip'},
            {worker: RightWorker, cmd: 'right'},
            {worker: FlipWorker2, cmd: 'left'}
        ];

        function Decode() {
            if(workerCount > 0) return;
            workerCount = workerContexts.length;
            RunNextWorker();
        }

        function RunNextWorker() {
            var worker = workerContexts[0];
            workerContexts.shift();
            if(usesWorkers) {
                worker.worker.postMessage({pixels: ctx.getImageData(0,0,canvas.width,canvas.height).data, cmd: worker.cmd});
            } else {
                receiveMessage({data: RunSingleThreaded({data: {pixels: ctx.getImageData(0,0,canvas.width,canvas.height).data}, cmd: worker.cmd})});
            }
        }

        Decode();
    }

    return {
        decode: decode,
        decodeImg: decodeImg,
        decodeCanvas: decodeCanvas
    }
}(barcode_decode));