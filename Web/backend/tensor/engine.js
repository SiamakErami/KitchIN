const node = require('@tensorflow/tfjs-node');
const tf = require('@tensorflow/tfjs');
const io = require('fs');
const path = require('path');

const classes = [
    'Bread', 'Dairy product', 'Egg', 'Meat',  'Rice', 'Seafood', 'Vegetable-Fruit'
    , 'apple',
    'banana', 
    'carrot', 'corn', 'cucumber', 'garlic', 'grapes', 'lemon', 'lettuce', 'mango', 'onion', 'orange', 
  'pineapple', 'potato', 'spinach', 'tomato','watermelon']
TARGET_CLASSES = Object.assign({}, classes);

// file://./model/model.json
function predictImage(req, res) {
    tf.loadLayersModel("file://backend/tensor/model/model.json").then(function (model) {
        console.log('Model loaded successfully');
        // Web/backend/tensor/model/model.json
        req.file = Object.values(req.files)[0];

        let fileUploaded = req.file;
        // convert fileUploaded to buffer
        let buffer = fileUploaded.buffer;

        // let imageBuffer = io.readFileSync(buffer);
        // let tfimage = node.node.decodeImage(buffer);
        let tfimage = node.node.decodeImage(buffer);
        tfimage = tfimage.resizeNearestNeighbor([100, 100]);
        tfimage = tfimage.expandDims();
        tfimage = tfimage.toFloat();
        tfimage = tfimage.div(tf.scalar(255.0));
        console.log("reached 1");
        let predictions = model.predict(tfimage).dataSync();
        let results = Array.from(predictions)
            .map(function (p, i) {
                return {
                    probability: p,
                    className: TARGET_CLASSES[i]
                };
            }).sort(function (a, b) {
                return b.probability - a.probability;
            }).splice(0, 2);

        console.log(results);

        // create an array of just the class names
        let class_names = results.map(function (x) {
            return x.className;
        });

        return res.status(200).json({
            class_names: class_names
        });
    }).catch(function (err) {
        console.log("Error in loading model: " + err);
    });
}

// backend/tensor/data/test/istockphoto-522566233-612x612.jpg
// backend/tensor/data/test/BHG-milk-bread-4CdeIL1uKGyB5ryU8J_EED-aaa76729c86a413ca7500029edba79f0.jpg

module.exports = {
    predictImage
};