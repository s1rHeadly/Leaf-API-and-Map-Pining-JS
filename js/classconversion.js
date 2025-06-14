import { getElement, randomNumber, months, validNumber } from "./utils.js";

(function () {
  "use strict";

  /*
  ==============================
  Workout Class (Base Class)
  ==============================
  This class is the foundation for all workout types.
  It holds shared properties like coordinates, distance, duration, date, and ID.
  The _setDescription() method generates a readable label for the workout.
  */
  class Workout {
    date = new Date();

    constructor(coords, distance, duration, id = null) {
      this.coords = coords; // [lat, lng]
      this.distance = distance; // in km
      this.duration = duration; // in minutes
      this.id = id ?? randomNumber();
      // immediately evoke methods
      this._setDescription(); // automatically generate description
    }

    _setDescription() {
      const calendarMonths = months;
      this.description = `${this.date.getDate()} ${
        calendarMonths[this.date.getMonth()]
      } ${this.date.getFullYear()}`;
    }
  }

  /*
  ==============================
  Running Class (Child of Workout)
  ==============================
  Adds cadence and pace calculation specific to running workouts.
  */
  class Running extends Workout {
    type = "running";

    constructor(coords, distance, duration, cadence, id = null) {
      super(coords, distance, duration, id); // we use super to get the values from the parent class
      this.cadence = cadence;
      this._calcPace(); //evoke calcPace() inside the constructor
    }

    _calcPace() {
      // create calcPace
      this.pace = this.duration / (this.distance / 60);
    }
  }

  /*
  ==============================
  Cycling Class (Child of Workout)
  ==============================
  Adds elevation gain and speed calculation specific to cycling workouts.
  */
  class Cycling extends Workout {
    type = "cycling";

    constructor(coords, distance, duration, elevationGain, id = null) {
      super(coords, distance, duration, id);
      this.elevationGain = elevationGain;
      this.calcSpeed(); // evoke calcSpeed inside the constructor
    }

    calcSpeed() {
      // create calcSpeed()
      this.speed = this.distance / this.duration;
    }
  }

  // Testing instantiations
  // const running1 = new Running([45, -12], 5.7, 4.8, 455);
  // const cycling1 = new Cycling([35, -34], 8, 23, 120);
  // console.log({ running1, cycling1 });

  /*
  ==============================
  App Class (Main UI and State Handler)
  ==============================
  Manages DOM elements, map setup, form submission, and application state.
  */
  class App {
    #locations = []; // Private list of all workouts

    constructor() {
      // DOM Targets
      this.form = getElement("form");
      this.containerWorkouts = getElement(".workouts");
      this.inputType = getElement(".form__input--type");
      this.inputDistance = getElement(".form__input--distance");
      this.inputDuration = getElement(".form__input--duration");
      this.inputCadence = getElement(".form__input--cadence");
      this.inputElevation = getElement(".form__input--elevation");
      this.mapEl = getElement("#map");

      // App-level State
      this.currentLat = null;
      this.currentLong = null;
      this.map = null;
      this.lastClickedPosition = null;
      this.isWorkoutValid = false;

      // App Bootstrapping
      this._init();
    }

    async _init() {
      try {
        const { lat, long } = await this._getCurrentLocation();
        this.currentLat = lat;
        this.currentLong = long;

        this._initialiseMap({ currentLat: lat, currentLong: long });

        this._loadLocalStorage(); // load saved workouts and show markers
      } catch (error) {
        console.log("Location error:", error);
      }

      this._eventHandlers();
    }

    async _getCurrentLocation() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject("Geolocation is not supported by this browser.");
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const long = position.coords.longitude;
            resolve({ lat, long });
          },
          (error) => reject(error.message)
        );
      });
    }

    _initialiseMap({ currentLat, currentLong }) {
      const currentLocation = [currentLat, currentLong];

      this.map = L.map(this.mapEl).setView(currentLocation, 13);

      L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this.map);
    }

    _addMarkers(workout) {
      // console.log({ workout });
      const { coords, description, type } = workout;
      L.marker(coords)
        .addTo(this.map)
        .bindPopup(
          L.popup({
            autoClose: false,
            closeOnClick: false,
            className: `${type}-popup`,
          }).setContent(
            `<p>${
              type.charAt(0).toUpperCase() + type.slice(1)
            } ${description}</p>`
          )
        )
        .openPopup();
    }

    _onHandleMapClick(e) {
      if (this.form.classList.contains("hidden")) {
        this.form.classList.remove("hidden");
        this._updateSelect({ target: this.inputType });
      }

      this.inputDistance.focus();
      const { latlng } = e;
      this.lastClickedPosition = [latlng.lat, latlng.lng];
    }

    _updateSelect(e) {
      const value = e.target.value;

      const cadenceRow = this.inputCadence.closest(".form__row");
      const elevationRow = this.inputElevation.closest(".form__row");

      cadenceRow.classList.remove("form__row--hidden");
      elevationRow.classList.remove("form__row--hidden");

      if (value === "running") {
        this.inputElevation
          .closest(".form__row")
          .classList.add("form__row--hidden");
        this.inputCadence
          .closest(".form__row")
          .classList.remove("form__row--hidden");
      } else if (value === "cycling") {
        this.inputCadence
          .closest(".form__row")
          .classList.add("form__row--hidden");
        this.inputElevation
          .closest(".form__row")
          .classList.remove("form__row--hidden");
      }
    }

    _eventHandlers() {
      if (this.map) {
        this.map.on("click", this._onHandleMapClick.bind(this));
      }
      this.form.addEventListener("submit", this._submitNewWorkout.bind(this));
      this.inputType.addEventListener("change", this._updateSelect.bind(this));
    }

    _resetForm() {
      this.inputDistance.value = "";
      this.inputDuration.value = "";
      this.inputCadence.value = "";
      this.inputElevation.value = "";
      this.form.classList.add("hidden");
    }

    _setLocalStorage(array) {
      localStorage.setItem("locations", JSON.stringify(array));
    }

    _loadLocalStorage() {
      const data = localStorage.getItem("locations");
      if (!data) return;

      // Parse the stored array of workouts
      const workoutsArray = JSON.parse(data);

      // Because the stored objects lose their class methods,
      // you should re-instantiate them as Running or Cycling instances:

      this.#locations = workoutsArray
        .map((obj) => {
          if (obj.type === "running") {
            return new Running(
              obj.coords,
              obj.distance,
              obj.duration,
              obj.cadence,
              obj.id
            );
          } else if (obj.type === "cycling") {
            return new Cycling(
              obj.coords,
              obj.distance,
              obj.duration,
              obj.elevationGain,
              obj.id
            );
          }
          return null;
        })
        .filter(Boolean);

      // Optionally, render markers for the loaded workouts:
      this.#locations.forEach((workout) => this._addMarkers(workout));
    }

    _validateWorkoutData() {
      const distance = +this.inputDistance.value;
      const duration = +this.inputDuration.value;
      const cadence = +this.inputCadence.value;
      const elevation = +this.inputElevation.value;
      const type = this.inputType.value; // selection of runningn or cycling

      if (!validNumber(distance, duration)) {
        alert("Please enter positive numbers for distance and duration.");
        return false;
      }

      if (type === "running" && !validNumber(cadence)) {
        alert("Please enter a positive number for cadence.");
        return false;
      }

      if (type === "cycling" && !validNumber(elevation)) {
        alert("Please enter a positive number for elevation gain.");
        return false;
      }

      if (!this.lastClickedPosition) {
        alert("Please click on the map to select a location.");
        return false;
      }

      return true;
    }

    _submitNewWorkout(e) {
      e.preventDefault();

      if (!this._validateWorkoutData()) return;

      const type = this.inputType.value;
      const distance = +this.inputDistance.value;
      const duration = +this.inputDuration.value;
      const cadence = +this.inputCadence.value;
      const elevation = +this.inputElevation.value;

      console.log("Cadence value:", cadence); // 👈 add this

      let workout; //declare var to hold each workout

      if (type === "running") {
        workout = new Running(
          this.lastClickedPosition,
          distance,
          duration,
          cadence
        );
      } else if (type === "cycling") {
        workout = new Cycling(
          this.lastClickedPosition,
          distance,
          duration,
          elevation
        );
      }

      this.#locations.push(workout); // push each workout to the locations array
      this._setLocalStorage(this.#locations);
      this._addMarkers(workout); // adds the workout to the addMarkers Method
      this._resetForm(); // then call resetForm metho
    }
  }

  // App instantiation for development access
  const initialLoad = new App();
  window.app = initialLoad;
})();
