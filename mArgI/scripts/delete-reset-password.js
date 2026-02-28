const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'app', '(auth)', 'reset-password');

function deleteFolderRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
    console.log(`Successfully deleted ${directoryPath}`);
  } else {
    console.log(`${directoryPath} does not exist.`);
  }
}

deleteFolderRecursive(target);
