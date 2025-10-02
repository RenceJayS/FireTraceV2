const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'Admin',       // from your Cloudinary dashboard
  api_key: '342975676546821',
  api_secret: 'pSixVMG4_iNeEdDHRp1Mlu4F_KI',
});

module.exports = cloudinary;
