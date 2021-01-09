(function() {
   let template = document.createElement("template");
   template.innerHTML = `
      <link rel="stylesheet" href="https://js.arcgis.com/4.17/esri/themes/light/main.css">
      <style>
          #mapview {
              width: 100%;
              height: 100%;
          }
      </style>
      <div id='mapview'></div>
   `;
 
    class Map extends HTMLElement {
      constructor() {
          super();
          //this._shadowRoot = this.attachShadow({mode: "open"});
          this.appendChild(template.content.cloneNode(true));
          this._props = {};
          let that = this;
 
          require([
              "esri/widgets/Sketch",
              "esri/layers/GraphicsLayer",
              "esri/layers/FeatureLayer",
              "esri/WebScene",
              "esri/views/SceneView",
              "esri/widgets/Editor"
          ], function (Sketch,GraphicsLayer,FeatureLayer, WebScene, SceneView, Editor) {            // Create a map from the referenced webscene item id

              let webscene = new WebScene({
                  portalItem: {
                      id: "206a6a13162c4d9a95ea6a87abad2437"
                  }
              });

              // Create a layer with visualVariables to use interactive handles for size and rotation
    
              var view = new SceneView({
                  container: "mapview",
                  qualityProfile: "high",
                  map: webscene
              });
    
              view.when(function () {
                  view.popup.autoOpenEnabled = false; //disable popups
                  // Create the Editor
//                  var editor = new Editor({
//                      view: view
//                  });
                  
                  // Add widget to top-right of the view
//                  view.ui.add(editor, "top-right");
        
//                  const satelliteCheckbox = document.getElementById("satellite");
                  // change event handler to set the basempa accordingly
//                  satelliteCheckbox.addEventListener("change", function (event) {
//                      view.map.basemap = event.target.checked ? "satellite" : "";
//                  });
                  
                  // Add the checkbox to the bottom-right of the view
                  view.ui.add("setting", "bottom-right");
              });
          });
    
      }
 
      getSelection() {
          return this._currentSelection;
      }
 
      async setDataSource(source) {
          this._dataSource = source;
          let googleResult = await fetch("https://app.boshdbserver.hanademo.cloud/sap/sw/majorincidents.json");
          let results = await googleResult.json();
          console.log(results);
 
          let resultSet = await source.getResultSet();
          const that = this;
          this._spatialLayer.queryFeatures().then(function(mapFeatures){
              const features = mapFeatures.features;

              const edits = {
                  updateFeatures: []
              }
 
              const loc_id = that._props["locId"] || "";
 
              let max = 0;
              for(let feature of features) {
                  let result = resultSet.find((result) => feature.attributes[loc_id] == result[loc_id].id);
                  let value = result ? parseFloat(result["@MeasureDimension"].rawValue) : null;
 
                  feature.attributes["Measure"] = value;
                  max = value > max ? value : max;
 
                  edits.updateFeatures.push(feature);
              }
 
              edits.updateFeatures.forEach((feature) => feature.attributes["Max"] = max);
 
              that._spatialLayer.applyEdits(edits)
              .then((editResults) => {
                   console.log(editResults);
              })
              .catch((error) => {
                  console.log("===============================================");
                  console.error(
                      "[ applyEdits ] FAILURE: ",
                      error.code,
                      error.name,
                      error.message
                  );
                  console.log("error = ", error);
              })
          });                                   
      }
 
      onCustomWidgetBeforeUpdate(changedProperties) {
             this._props = { ...this._props, ...changedProperties };
      }
          onCustomWidgetAfterUpdate(changedProperties) {
      }
    }
 
    let scriptSrc = "https://js.arcgis.com/4.17/"
    let onScriptLoaded = function() {
        customElements.define("com-sap-custom-geomap", Map);
    }
 
    //SHARED FUNCTION: reuse between widgets
    //function(src, callback) {
    let customElementScripts = window.sessionStorage.getItem("customElementScripts") || [];
 
    let scriptStatus = customElementScripts.find(function(element) {
        return element.src == scriptSrc;
    });
 
    if (scriptStatus) {
        if(scriptStatus.status == "ready") {
            onScriptLoaded();
        } else {
            scriptStatus.callbacks.push(onScriptLoaded);
        }
    } else {
        let scriptObject = {
          "src": scriptSrc,
          "status": "loading",
          "callbacks": [onScriptLoaded]
        }
 
        customElementScripts.push(scriptObject);
 
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = scriptSrc;
        script.onload = function(){
            scriptObject.status = "ready";
            scriptObject.callbacks.forEach((callbackFn) => callbackFn.call());
        };
        document.head.appendChild(script);
    }
    //}
    //END SHARED FUNCTION
})();