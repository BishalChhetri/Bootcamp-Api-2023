// const GeocoderArcGIS = require("geocoder-arcgis");

// const geocoder = new GeocoderArcGIS({
//   //   client_id: process.env.ARCGIS_CLIENT_ID, // optional, see below
//   //   client_secret: process.env.ARCGIS_CLIENT_SECRET, // optional, see below

//   client_id: "ZfRrGK1vcK2TT7o9", // optional, see below
//   client_secret: "4a697c16e8394565bd8c505f2a08e530", // optional, see below
// });

const request = require("request");

const geocode = function (address) {
  const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=${address}&category=&outFields=*&forStorage=false&f=pjson`;
  return new Promise((resolve, reject) => {
    request.get({ url, json: true }, (error, response, body) => {
      if (error) {
        return reject(error);
      } else resolve(body.candidates[0]);
    });
  });
};

module.exports = geocode;
