import { getElement, randomNumber, months } from "./utils.js";
(function () {
  "use strict";

  /*
  =============
  DOM Targets
  =============
  */
  const form = getElement("form");
  const containerWorkouts = getElement(".workouts");
  const inputType = getElement(".form__input--type");
  const inputDistance = getElement(".form__input--distance");
  const inputDuration = getElement(".form__input--duration");
  const inputCadence = getElement(".form__input--cadence");
  const inputElevation = getElement(".form__input--elevation");
  const mapEl = getElement("#map");

  /*
  ================
  Globals 
  ================
  */

  let currentLat, currentLong; // used for populating lat and lang when the page loads
  let map; // when the leaflet map object gets populated then we can use it elsewhere
  let clickedLocations = [];

  /*
  ================
  Functions
  ================
  */

  /**
   *
   * @returns {Promise<{lat: number, long: number}>}
   * Function to get the current location of the user.
   */

  function getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation is not supported by this browser.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const long = position.coords.longitude;
          resolve({ lat, long }); // return pure values
        },
        (error) => {
          reject(error.message);
        }
      );
    });
  }

  /**
   * Initializes the Leaflet map centered at the given latitude and longitude.
   *
   * @param {Object} options - Options for initializing the map.
   * @param {number} options.currentLat - The latitude to center the map.
   * @param {number} options.currentLong - The longitude to center the map.
   */

  function initialiseMap(options) {
    const { currentLat, currentLong } = options;
    const currentLocation = [currentLat, currentLong];

    // set the leafletmap
    map = L.map(mapEl, {
      closePopupOnClick: false,
      markerZoomAnimation: true,
    }).setView(currentLocation, 13);
    // console.log({map}); => the leaflet map object

    // set the initial leaflet tileLayer which is 'Open Street Map'
    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
  }

  /*
  ================
  Events
  ================
  */

  /**
   * Adds a marker to the Leaflet map at the specified position with a popup.
   *
   * @param {Object} options - Options for the marker.
   * @param {number[]} options.position - Array containing latitude and longitude [lat, lng].
   * @param {string} options.placeholder - Text to display in the marker's popup.
   */

  function addMarkers(options) {
    const position = options.position;
    const text = options.placeholder;
    // add the leaflet marker chain
    L.marker(position, {
      riseOnHover: true,
      keyboard: true,
    })
      .addTo(map)
      .bindPopup(text, {
        autoClose: false,
        closeOnClick: false,
        maxWidth: 250,
        minWidth: 100,
        className: "running-popup",
      })
      .openPopup();
  }

  /**
   * Handles click events on the Leaflet map.
   * Adds a marker at the clicked location, stores the coordinates, and logs all clicked locations.
   *
   * @param {Object} e - Leaflet map click event object.
   * @param {Object} e.latlng - Object containing latitude and longitude of the click.
   * @param {number} e.latlng.lat - Latitude of the clicked point.
   * @param {number} e.latlng.lng - Longitude of the clicked point.
   */
  function onHandleMapClick(e) {
    const { latlng } = e;
    const clickedLat = latlng?.lat;
    const clickedLong = latlng?.lng;

    /* add marker to map */
    const clickedPosition = [clickedLat, clickedLong];

    addMarkers({
      position: clickedPosition,
      placeholder: "some dummy text for now",
    });

    /* add marker postions to clickedLocations */
    const positionClicked = {
      lat: clickedLat,
      long: clickedLong,
    };

    clickedLocations.push(positionClicked);

    /* Log the whole array */
    console.log("All clicked locations:", clickedLocations);
  }

  /* MAIN EVENT HANDLER FUNCTION */
  function eventHandlers() {
    if (map) {
      map.on("click", onHandleMapClick); // this on click event is leaflet specific
    }
  } /*CLOSE MAIN EVENT HANDLER FUNCTION */

  /**
  ================
  Init function 
  ================
   */

  /**
   * Initializes the application by getting the user's current location,
   * initializing the Leaflet map, and setting up event handlers.
   *
   * @returns {Promise<void>} Resolves when initialization is complete.
   */

  async function init() {
    try {
      const { lat, long } = await getCurrentLocation();
      currentLat = lat;
      currentLong = long;
      // evoke the map and once that promise is resolved with the at and long, pass the values back to where this function is created
      initialiseMap({
        currentLat,
        currentLong,
      });

      console.log({ currentLat, currentLong });
    } catch (error) {
      console.log("Location error:", error);
    }

    eventHandlers();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
