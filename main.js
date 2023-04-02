import './style.css'
//  import 'leaflet/dist/leaflet.css'
import 'leaflet-geosearch/dist/geosearch.css';


//  import L from 'leaflet'

import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';

// import parseGeoraster from 'georaster';
//  import GeoRasterLayer from 'georaster-layer-for-leaflet';
import geoblaze from 'geoblaze';

let provider = new OpenStreetMapProvider();
function getColor(d) {
  return d > 200 ? '#b10026' :
    d > 100 ? '#e31a1c' :
      d > 50 ? '#fc4e2a' :
        d > 40 ? '#fd8d3c' :
          d > 20 ? '#feb24c' :
            d > 10 ? '#ffeda0' :
              d > 5 ? '#ffffcc' :
              d > 0 ? '#f6ffcc':
                '#238b45';
}


const map = L.map('map', {
  center: [35.50, -90],
  zoom: 5
});

var southWest = L.latLng(0, -180),
  northEast = L.latLng(90, -60.885444);
var bounds = L.latLngBounds(southWest, northEast);

L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.hydroshare.org/resource/9ebc0a0b43b843b9835830ffffdd971e/">Simple lab</a> <a href="https://sdwis.epa.gov/ords/sfdw_pub/r/sfdw/sdwis_fed_reports_public/200"> & EPA</a>; ',
  subdomains: 'abcd',
  ext: 'png',
  minNativeZoom: 3,
  minZoom: 3,
  maxNativeZoom: 11,
  maxZoom: 11,
  tms: false,
  bounds: bounds
}).addTo(map);

var url_to_geotiff_file = 'https://temmdata.s3.us-east-005.backblazeb2.com/cogviolations.tif';

const opts = {url: null, fn: null, zIndex: 2000};


async function getData(x,y) {
  let result = await geoblaze.identify(url_to_geotiff_file,[x, y]);
  return result;
}

var theMarker = {};

map.on('geosearch/showlocation', function (e) {
  let lat = e.location.y;
  let lng = e.location.x;

  getData(lng,lat).then(data => {
    if (theMarker != undefined) {
      map.removeLayer(theMarker);
};
    theMarker = L.marker([lat, lng]).addTo(map);
    if (data<0){
      theMarker.bindPopup('No data').openPopup();
    } else {
      theMarker.bindPopup(data[0].toString() + ' Violations').openPopup();
    }
  })
});
parseGeoraster(url_to_geotiff_file).then(result => {
  var georasterData = result;
  var gopts = {
     georaster: georasterData
     ,opacity: 0.7
     ,resolution: 256
     ,        pixelValuesToColorFn: function(pixelValues) {
       var pixelValue = pixelValues[0]; // there's just one band in this raster
       // if there's zero wind, don't return a color
       if (pixelValue < 0) return null;
       var color = getColor(pixelValue);
       return color;
     }
      };
      Object.assign(gopts, opts);
      var layer = new GeoRasterLayer(gopts);
      layer.addTo(map);
    });

        const searchControl = new GeoSearchControl({
          provider: provider,
          autoComplete: true, // optional: true|false  - default true
          autoCompleteDelay: 250,
          style: 'bar',
          showMarker: false,
          showPopup: false,           // optional: true|false  - default false
    });
    map.addControl(searchControl);
    var legend = L.control({position: 'topright'});

legend.onAdd = function(map){

    var div = L.DomUtil.create('div', 'info legend'),
    grades = [0,1,5,10, 20, 40, 50, 100, 200],
    labels = ['<strong> Violations </strong>'],
    from, to;

for (var i = 0; i < grades.length; i++) {
    from = grades [i];
    to = grades[i+1];

labels.push(
    '<i style="background:' + getColor(from) + '"></i> ' +
    from + (to ? '&ndash;' + to : '+'));
    }
    div.innerHTML = labels.join('<br>');
    return div;


    };
legend.addTo(map);




