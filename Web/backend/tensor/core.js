const tf = require('@tensorflow/tfjs-node');
const data = require('./loader');
const model = require('./model');

async function run(epochs, batchSize, modelSavePath) {
  console.log("Loading data123...");
  data.loadData();
  console.log("Data loaded successfully");
  const {images: trainImages, labels: trainLabels} = data.getTrainData();
  console.log("Training Images (Shape): " + trainImages.shape);
  console.log("Training Labels (Shape): " + trainLabels.shape);
model.summary();
const validationSplit = 0.15;

console.log("trainImages shape: " + trainImages.shape);
console.log("trainLabels shape: " + trainLabels.shape);
console.log("trainImages size: " + trainImages.size);
console.log("trainLabels size: " + trainLabels.size);

  await model.fit(trainImages, trainLabels, {
    epochs,
    batchSize,
    validationSplit
  });
  console.log("Training complete");
const {images: testImages, labels: testLabels} = data.getTestData();
  console.log(testImages)
  console.log(testLabels)
  const evalOutput = model.evaluate(testImages, testLabels);
console.log(
      `\nEvaluation result:\n` +
      `  Loss = ${evalOutput[0].dataSync()[0].toFixed(3)}; `+
      `Accuracy = ${evalOutput[1].dataSync()[0].toFixed(3)}`);
if (modelSavePath != null) {
    await model.save(`file://${modelSavePath}`);
    console.log(`Saved model to path: ${modelSavePath}`);
  }
}
run(50, 24,'./model');