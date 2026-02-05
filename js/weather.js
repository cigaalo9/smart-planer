/**
 * Weather API Integration Module
 * Fetches current weather data from OpenWeather API
 * Includes caching, error handling, and loading states
 */

const WeatherAPI = {
  // IMPORTANT: Replace with your actual OpenWeather API key
  // Get a free API key at: https://openweathermap.org/api
  API_KEY: 'e4b679990d1e976882e18c6fec708628',
  BASE_URL: 'https://api.openweathermap.org/data/2.5/weather',

  /**
   * Fetch weather data for a city
   * @param {string} city - City name
   * @returns {Promise<Object>} Weather data
   */
  async fetchWeather(city) {
    // Check cache first
    const cachedData = StorageUtil.getWeatherCache();
    if (cachedData && cachedData.city === city) {
      console.log('Using cached weather data');
      return cachedData;
    }

    // Validate API key
    if (!this.API_KEY || this.API_KEY === 'YOUR_API_KEY_HERE') {
      throw new Error('API key not configured. Please add your OpenWeather API key in js/weather.js');
    }

    try {
      const url = `${this.BASE_URL}?q=${encodeURIComponent(city)}&appid=${this.API_KEY}&units=metric`;
      
      const response = await fetch(url);
      
      // Handle HTTP errors
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`City "${city}" not found`);
        } else if (response.status === 401) {
          throw new Error('Invalid API key');
        } else if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later.');
        } else {
          throw new Error(`Weather service error: ${response.status}`);
        }
      }

      const data = await response.json();
      
      // Transform data to our format
      const weatherData = {
        city: data.name,
        country: data.sys.country,
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        pressure: data.main.pressure,
        timestamp: Date.now()
      };

      // Cache the data
      StorageUtil.saveWeatherCache(weatherData);

      return weatherData;

    } catch (error) {
      // Network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection.');
      }
      
      // Re-throw other errors
      throw error;
    }
  },

  /**
   * Get weather icon URL
   * @param {string} iconCode - Weather icon code from API
   * @returns {string} Icon URL
   */
  getIconUrl(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  },

  /**
   * Format temperature with unit
   * @param {number} temp - Temperature in Celsius
   * @param {string} unit - Unit ('C' or 'F')
   * @returns {string} Formatted temperature
   */
  formatTemperature(temp, unit = 'C') {
    if (unit === 'F') {
      temp = (temp * 9/5) + 32;
    }
    return `${Math.round(temp)}°${unit}`;
  },

  /**
   * Get weather condition emoji
   * @param {string} description - Weather description
   * @returns {string} Emoji
   */
  getWeatherEmoji(description) {
    const desc = description.toLowerCase();
    
    if (desc.includes('clear')) return '☀️';
    if (desc.includes('cloud')) return '☁️';
    if (desc.includes('rain')) return '🌧️';
    if (desc.includes('snow')) return '❄️';
    if (desc.includes('thunder')) return '⛈️';
    if (desc.includes('mist') || desc.includes('fog')) return '🌫️';
    if (desc.includes('wind')) return '💨';
    
    return '🌤️'; // Default
  }
};

/**
 * Weather Widget Controller
 * Manages the weather widget display on the dashboard
 */
class WeatherWidget {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.loading = false;
  }

  /**
   * Initialize the weather widget
   */
  async init() {
    if (!this.container) {
      console.error('Weather container not found');
      return;
    }

    const settings = StorageUtil.getSettings();
    const city = settings.city || 'London';

    await this.loadWeather(city);
  }

  /**
   * Load and display weather data
   * @param {string} city - City name
   */
  async loadWeather(city) {
    if (this.loading) return;
    
    this.loading = true;
    this.showLoading();

    try {
      const weatherData = await WeatherAPI.fetchWeather(city);
      this.displayWeather(weatherData);
    } catch (error) {
      console.error('Weather fetch error:', error);
      this.showError(error.message);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Display loading state
   */
  showLoading() {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="weather-widget">
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading weather...</p>
        </div>
      </div>
    `;
  }

  /**
   * Display weather data
   * @param {Object} data - Weather data
   */
  displayWeather(data) {
    if (!this.container) return;

    const emoji = WeatherAPI.getWeatherEmoji(data.description);

    this.container.innerHTML = `
      <div class="weather-widget">
        <div class="weather-location">${emoji} ${data.city}, ${data.country}</div>
        <div class="weather-temp">${data.temperature}°C</div>
        <div class="weather-description">${data.description}</div>
        <div class="weather-details">
          <div class="weather-detail">
            <span>💧</span>
            <span>${data.humidity}%</span>
          </div>
          <div class="weather-detail">
            <span>💨</span>
            <span>${data.windSpeed} m/s</span>
          </div>
          <div class="weather-detail">
            <span>🌡️</span>
            <span>Feels ${data.feelsLike}°C</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Display error message
   * @param {string} message - Error message
   */
  showError(message) {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="weather-widget">
        <div class="weather-error">
          <p>⚠️ Weather Unavailable</p>
          <p class="text-small">${message}</p>
        </div>
      </div>
    `;
  }

  /**
   * Update city and reload weather
   * @param {string} city - New city name
   */
  async updateCity(city) {
    StorageUtil.updateSetting('city', city);
    await this.loadWeather(city);
  }
}

// Make WeatherAPI and WeatherWidget available globally
if (typeof window !== 'undefined') {
  window.WeatherAPI = WeatherAPI;
  window.WeatherWidget = WeatherWidget;
}
