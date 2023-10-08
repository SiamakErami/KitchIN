const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');
const TRAIN_IMAGES_DIR = './model/data/train';
const TEST_IMAGES_DIR = './model/data/test';
/*
  'Bread', 'Dairy product', 'Egg', 'Meat',  'Rice', 'Seafood', 'Vegetable-Fruit'
, 'apple',
'banana', 
'carrot', 'corn', 'cucumber', 'garlic', 'grapes', 'lemon', 'lettuce', 'mango', 'onion', 'orange', 
*/
const classes = [
  'Bread', 'Dairy product', 'Egg', 'Meat',  'Rice', 'Seafood', 'Vegetable-Fruit'
  , 'apple',
  'banana', 
  'carrot', 'corn', 'cucumber', 'garlic', 'grapes', 'lemon', 'lettuce', 'mango', 'onion', 'orange', 
'pineapple', 'potato', 'spinach', 'tomato','watermelon']
//Total number of classes
const n = classes.length;
// 24
console.log("Classes: " + n);
function loadImages(dataDir) {
  const images = [];
  const labels = [];
  
  for(let j=0; j < n -1; j++)
  {
    
    let dataDir1 = dataDir + `/${classes[j]}`;
    console.log("dataDir = " + dataDir1);
    var files =fs.readdirSync(dataDir1);
    for (let i = 0; i < files.length; i++) { 
      console.log(`Checking ${classes[j]} images..|| image = ${files[i]}`);
      if (!files[i].toLocaleLowerCase().endsWith(".jpg")) {
        continue;
      }
  
      var filePath = path.join(dataDir1, files[i]);
      console.log("filePath = " + filePath);
      
      var buffer = fs.readFileSync(filePath);
      var imageTensor = tf.node.decodeImage(buffer)
        .resizeNearestNeighbor([100, 100])
        // target expected a batch of elements where each example has shape [4] (i.e.,tensor shape [*,4]) but the target received an input with 6394 examples, each with shape [24] (tensor shape [6394,24])
        // so we reshape it to [100,100,3]
        .toFloat()
        .div(tf.scalar(255.0))
        .expandDims();
      images.push(imageTensor);
      labels.push(j);

      console.log("Size: " + imageTensor.shape);
      
    }
  }
  return [images, labels];
}
// Helper class to handle loading training and test data. 
class FoodDataset {
  constructor(_n) {
    this.trainData = [];
    this.testData = [];
    this.n = _n;
  }
// Loads training and test data. 
  loadData() {
    console.log('Loading images...');
    this.trainData = loadImages(TRAIN_IMAGES_DIR);
    console.log(this.trainData)
    this.testData = loadImages(TEST_IMAGES_DIR);
    console.log('Images loaded successfully.')
  }
getTrainData() {

  console.log("1");
  let imagesReturn = tf.concat(this.trainData[0]);
  console.log("2");
  let labelsReturn = tf.oneHot(tf.tensor1d(this.trainData[1], 'int32'), this.n).toFloat();
  console.log("3");


    return {
      images: imagesReturn,
      labels: labelsReturn
    }
  }
getTestData() {
    return {
      images: tf.concat(this.testData[0]),
      labels: tf.oneHot(tf.tensor1d(this.testData[1], 'int32'), this.n).toFloat() 
    }
  }
}
module.exports = new FoodDataset(n);
