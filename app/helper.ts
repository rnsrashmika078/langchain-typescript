
export const requestWeatherAPI = async (city: string) => {
  try {
    const res = await fetch(
      // `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${city}`,
      `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${city}`,
    );

    const data = await res.json();
    return data.current;
  } catch (error) {
    return error;
  }
};
