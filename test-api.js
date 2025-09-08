// Test TMDB API connection
const axios = require('axios');

const API_KEY = '8dac4150f8a6a7d654ed10717f9bb6bf';
const BASE_URL = 'https://api.themoviedb.org/3';

async function testAPI() {
  console.log('Testing TMDB API connection...\n');
  
  try {
    // Test 1: Get genres
    console.log('1. Testing genre list endpoint...');
    const genreResponse = await axios.get(`${BASE_URL}/genre/movie/list`, {
      params: {
        api_key: API_KEY,
        language: 'en-US'
      }
    });
    console.log('✅ Genre endpoint works!');
    console.log(`   Found ${genreResponse.data.genres.length} genres\n`);
    
    // Test 2: Discover movies
    console.log('2. Testing discover endpoint...');
    const discoverResponse = await axios.get(`${BASE_URL}/discover/movie`, {
      params: {
        api_key: API_KEY,
        with_genres: '28', // Action genre
        'vote_average.gte': 7.0,
        'vote_count.gte': 500,
        sort_by: 'vote_average.desc',
        page: 1
      }
    });
    console.log('✅ Discover endpoint works!');
    console.log(`   Found ${discoverResponse.data.results.length} movies`);
    console.log(`   Sample movie: ${discoverResponse.data.results[0]?.title}\n`);
    
    // Test 3: Search movies
    console.log('3. Testing search endpoint...');
    const searchResponse = await axios.get(`${BASE_URL}/search/movie`, {
      params: {
        api_key: API_KEY,
        query: 'Inception',
        page: 1
      }
    });
    console.log('✅ Search endpoint works!');
    console.log(`   Found ${searchResponse.data.results.length} results for "Inception"\n`);
    
    console.log('🎉 All API tests passed! The TMDB API is working correctly.');
    
  } catch (error) {
    console.error('❌ API test failed!');
    console.error('Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('\n⚠️  Authentication failed. The API key might be invalid or expired.');
    } else if (error.response?.status === 404) {
      console.error('\n⚠️  Endpoint not found. The API URL might be incorrect.');
    } else {
      console.error('\n⚠️  Network or other error occurred.');
    }
  }
}

testAPI();