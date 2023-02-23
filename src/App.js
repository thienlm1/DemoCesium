import React from "react";
import {
  Ion, Viewer, createWorldTerrain,
  Cartesian3, Color, ColorMaterialProperty, Entity,
  PolylineGraphics, PointGraphics, ScreenSpaceEventHandler, 
  defined, ScreenSpaceEventType, PolygonGraphics
} from "cesium";

function App() {
  // Your access token can be found at: https://com/ion/tokens.
  // This is the default access token
  Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhYmMxZmU5ZC1lOGMxLTRiNTMtOGEyZC05NDNhYWU0OTY3OGYiLCJpZCI6MTIzNDYxLCJpYXQiOjE2NzU1OTExNzh9.IOvS6y_huoOmQJGhDoLtIlHu3wBloidrq3p714qI3CA';

  const viewer = new Viewer('cesiumContainer', {
    terrainProvider: createWorldTerrain()
  });




var request = new XMLHttpRequest();
request.open("GET", "https://s3.amazonaws.com/CMSTest/squaw_creek_container_info.xml", false);
request.send();
var xml = request.responseXML;


var stringPoint = "POINT"
var stringLine = "LINE"
var stringFace = "FACE"
var allPoint = xml.getElementsByTagName(stringPoint);
var allLine = xml.getElementsByTagName(stringLine);
var allFace = xml.getElementsByTagName(stringFace);
var height = 250

var listPoint = [];
// Create Point
for (let i = 0; i < allPoint.length; i++) {
    let id = allPoint[i].getAttribute("id")
    let dataPoint = allPoint[i].getAttribute("data");
    listPoint[i] = new Entity();
    listPoint[i].name = "Point number #" + i + " ID: " + id
    listPoint[i].show = false;
    listPoint[i].description = Cartesian3.fromDegrees(Number(dataPoint.split(",")[0].trim()), Number(dataPoint.split(",")[1].trim()), height)
    listPoint[i].position = Cartesian3.fromDegrees(Number(dataPoint.split(",")[0].trim()), Number(dataPoint.split(",")[1].trim()), height)
    const newPoint = new PointGraphics();
    newPoint.color = Color.BLUE;
    newPoint.pixelSize = 3
    listPoint[i].point = newPoint
    viewer.entities.add(listPoint[i])
}


function returnDegreesForLine(id) {
    let listDataPoint;
    for (let i = 0; i < allLine.length; i++) {
        let lineId = allLine[i].getAttribute("id")
        let data = allLine[i].getAttribute("path")
        if (id == lineId) {
            listDataPoint = data;
        }
    }
    let j = 0;
    const arr = [0, 0, 0, 0];
    for (let i = 0; i < allPoint.length; i++) {
        let PointID = allPoint[i].getAttribute("id")
        if (listDataPoint.split(",")[0].trim() == PointID
            || listDataPoint.split(",")[1].trim() == PointID) {
            let dataPoint = allPoint[i].getAttribute("data");
            arr[j] = Number(dataPoint.split(",")[0].trim())
            arr[j + 1] = Number(dataPoint.split(",")[1].trim())
            j = j + 2;
        }
    }
    return arr;
}

// Create Line
var listLine = []
for (let i = 0; i < allLine.length; i++) {
    let lineId = allLine[i].getAttribute("id")
    listLine[i] = new Entity();
    listLine[i].name = "line number #" + i + " ID: " + lineId
    listLine[i].show = false;
    listPoint[i].description = "Line position: " + Cartesian3.fromDegreesArray(returnDegreesForLine(lineId))
    const newLine = new PolylineGraphics();
    newLine.positions = new Cartesian3.fromDegreesArray(returnDegreesForLine(lineId))
    newLine.clampToGround = true;
    newLine.width = 2;
    newLine.material = new ColorMaterialProperty(Color.RED.withAlpha(0.5))
    listLine[i].polyline = newLine
    viewer.entities.add(listLine[i])
}

function contains(arr, value) {
    var i = arr.length;
    while (i--) {
        if (arr[i].trim() === value) {
            return true;
        }
    }
    return false;
}

function returnDegreesForFace(id) {
    let j = 0;
    const arr = [];
    for (let i = 0; i < allLine.length; i++) {
        let lineId = allLine[i].getAttribute("id")
        if (contains(id.split(","), lineId)) {
            const data = returnDegreesForLine(lineId)
            arr[j] = data[0]
            arr[j + 1] = data[1]
            arr[j + 2] = data[2]
            arr[j + 3] = data[3]
            j = j + 2;
        }
    }
    let lt = arr.length;
    let temp1 = arr[lt - 4]
    let temp2 = arr[lt - 3]
    arr[lt - 4] = arr[lt - 2]
    arr[lt - 3] = arr[lt - 1]
    arr[lt - 2] = temp1
    arr[lt - 1] = temp2
    return arr;
}

// Create Face
var listFace = []
for (let i = 0; i < allFace.length; i++) {
    var listDataLine = allFace[i].getElementsByTagName("POLYGON")[0].attributes[1].value
    var FaceID = allFace[i].getAttribute("id")
    listFace[i] = new Entity();
    listFace[i].name = "Face number #" + i + " ID: " + FaceID
    listFace[i].description = "Face position: " + Cartesian3.fromDegreesArray(returnDegreesForFace(listDataLine))
    const newFace = new PolygonGraphics();
    newFace.hierarchy = Cartesian3.fromDegreesArray(returnDegreesForFace(listDataLine))
    newFace.height = 250
    newFace.material = new ColorMaterialProperty(Color.RED.withAlpha(0.5))
    newFace.outlineColor = Color.BLACK
    newFace.outline = true;
    listFace[i].polygon = newFace
    viewer.entities.add(listFace[i])
}



//Picking
const scene = viewer.scene;
const handler = new ScreenSpaceEventHandler(scene.canvas);
handler.setInputAction((movement) => {
    const pick = scene.pick(movement.position);
    if (defined(pick)) {
        const entity =  viewer.entities.getById(pick.id.id)
        entity.polygon.material = new ColorMaterialProperty(Color.BLUE.withAlpha(0.5))
    }
}, ScreenSpaceEventType.LEFT_CLICK);


function findMidPoint(arr){
    let x = (arr[0]+arr[2])/2
    let y = (arr[1]+arr[3])/2
    return {x:x,y:y}
}
var listMidPoint = []

//Create Midpoint
for (let i = 0; i < listLine.length; i++) {
    let lineId = allLine[i].getAttribute("id")
    var dataPoint = findMidPoint(returnDegreesForLine(lineId))
    listMidPoint[i] = new Entity();
    listMidPoint[i].name = "Point number #" + i
    listMidPoint[i].show = true;
    listMidPoint[i].description = Cartesian3.fromDegrees(Number(dataPoint.x), Number(dataPoint.y), height)
    listMidPoint[i].position = Cartesian3.fromDegrees(Number(dataPoint.x), Number(dataPoint.y), height)
    const newPoint = new PointGraphics();
    newPoint.color = Color.YELLOW;
    newPoint.pixelSize = 3
    listMidPoint[i].point = newPoint
    viewer.entities.add(listMidPoint[i])
}

// Camera
viewer.trackedEntity = listMidPoint[0];

// document.querySelector('#toggle-mid-point').onclick = function() {
//   for(let i = 0; i <listMidPoint.length; i++){
//       listMidPoint[i].show = !listMidPoint[i].show;
//   }
// };
// document.querySelector('#toggle-point').onclick = function() {
//   for(let i = 0; i <listPoint.length; i++){
//       listPoint[i].show = !listPoint[i].show;
//   }
// };
// document.querySelector('#toggle-line').onclick = function() {
//   for(let i = 0; i <listLine.length; i++){
//       listLine[i].show = !listLine[i].show;
//   }
// };
// document.querySelector('#toggle-face').onclick = function() {
//   for(let i = 0; i <listFace.length; i++){
//       listFace[i].show = !listFace[i].show;
//   }
// };
// document.querySelector('#toggle-face-color').onclick = function() {
//   for(let i = 0; i <listFace.length; i++){
//       listFace[i].polygon.material = new ColorMaterialProperty(Color.RED.withAlpha(0.5))
//   }
// };

  return (
    <div>
    </div>
  );

  
}

export default App;