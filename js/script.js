import { getElement, randomNumber, months } from "./utils.js";
(function () {
  "use strict";

  // prettier-ignore
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const form = getElement("form");
  const containerWorkouts = getElement(".workouts");
  const inputType = getElement(".form__input--type");
  const inputDistance = getElement(".form__input--distance");
  const inputDuration = getElement(".form__input--duration");
  const inputCadence = getElement(".form__input--cadence");
  const inputElevation = getElement(".form__input--elevation");
  const mapEl = getElement("#map");
  let currentLat, currentLong;

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
   * Initializes the map using Leaflet.js
   */
  function initialiseMap(options) {
    const { currentLat, currentLong } = options;
    const currentLocation = [currentLat, currentLong];

    // learlet map code
    const map = L.map(mapEl).setView(currentLocation, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.marker(currentLocation)
      .addTo(map)
      .bindPopup("A pretty CSS popup.<br> Easily customizable.")
      .openPopup();
  }

  /**
   * initialise the application
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
    } catch (error) {
      console.log("Location error:", error);
    }
  }

  window.addEventListener("DOMContentLoaded", init);
})();
