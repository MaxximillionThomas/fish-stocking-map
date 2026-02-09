require([
    // No local esri folder needed as the arcgis js reference in Index.html points to the online version of the API, which includes all necessary modules
    "esri/config",
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/GeoJSONLayer",
    "esri/widgets/BasemapToggle",
    "esri/widgets/Search"
], function (esriConfig, Map, MapView, GeoJSONLayer, BasemapToggle, Search) {

    // Set the API Key - required for generating the basemap 
    esriConfig.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurHEe6Qt8vQLTcMOHhjjUcOai4zRm52zpqbe_N_Io0KCJpuysuvoS_olnWjiW179mACDnb9rx4YE52xtm9XyFT8EL0zO0CcS2Q8ThSeRVdiIn77HCPTkhBeuDLoWu4WVnMUNn_gSLqsdv5F4YaT027kncyF7J9ghq1MfHhr5dhuJmGDYh1AfR7l2GqbgV6VnG9wmXrUnmBRnOdzDvDR5FRXE.AT1_z8jiy4ia";

    // Initialize the map with a standard oceanic basemap
    const map = new Map({
        basemap: "arcgis-hillshade-dark"
    });

    // Load the map into view
    const view = new MapView({
        container: "viewDiv",
        map: map,
        // Centered on Ontario
        center: [-84.5, 48.5], 
        zoom: 5
    });

    // Create the Ontario GeoHub layer - required for retrieving data from the Ontario GeoHub dataset
    const ontarioLayer = new GeoJSONLayer({
        // Local path to the GeoJSON file
        url: "./data/fish-stock-events.geojson", 
        popupTemplate: {
            title: "Location: {Official_Waterbody_Name}", 
            content: 
            `
                <ul>
                    <li><strong>Species:</strong> {Species}</li>
                    <li><strong>Year Stocked:</strong> {Stocking_Year}</li>
                    <li><strong>Number of Fish:</strong> {Number_of_Fish_Stocked}</li>
                    <li><strong>Township:</strong> {Geographic_Township}</li>
                </ul>

                <p><i>Data provided by the Ministry of Natural Resources and Forestry.</i></p>
            `
        }
    });

    // Add the layer to the map
    map.add(ontarioLayer);

    // Add widgets for user interaction
    view.ui.add(new Search({ view: view }), "top-right");
    view.ui.add(new BasemapToggle({ view: view, nextBasemap: "arcgis-hillshade-light" }), "bottom-right");
});