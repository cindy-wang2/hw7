firebase.auth().onAuthStateChanged(async function(user){

  let db = firebase.firestore()
  let apiKey = '9b581f7d8c842c457d6c8baa24e27295'
  let response = await fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=en-US`)
  let json = await response.json()
  let movies = json.results

  if(user){
      db.collection('users').doc(user.uid).set({
      name: user.displayName,
      email: user.email
      })

      document.querySelector('.sign-in-or-sign-out').innerHTML = `<h3>Hi there, ${user.displayName}!</h3><a href="#" class="sign-out text-green-500 underline">Sign out</a>`

      document.querySelector('.sign-out').addEventListener('click', function(event){
        event.preventDefault()
        firebase.auth().signOut()
        document.location.href = 'movies.html'
    })

      //Render all movies
    
      for (let i=0; i<movies.length; i++) {
        let movie = movies[i]
        let userId = user.uid
        let opacityClass = ''
        let docRef = await db.collection('watched').doc(`${movie.id}`).get()
        let watchedMovie = docRef.data()
        if (watchedMovie) {
          opacityClass = 'opacity-20'
          let docRef = await db.collection('watched').where('userId', '==', user.uid).get()
        }else{
          opacityClass = 'opacity-1'
        }
  
      document.querySelector('.movies').insertAdjacentHTML('beforeend', `
        <div class="w-1/5 p-4 movie-${movie.id} ${opacityClass}">
          <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" class="w-full">
          <a href="#" class="watched-button block text-center text-white bg-green-500 mt-4 px-4 py-2 rounded">I've watched this!</a>
        </div>
      `)
      document.querySelector(`.movie-${movie.id}`).addEventListener('click', async function(event) {
        event.preventDefault()
        let movieElement = document.querySelector(`.movie-${movie.id}`)
        movieElement.classList.add('opacity-20')
        await db.collection('watched').doc(`${movie.id}`).set({})
      }) 
    }

  }else{
    //hide data
    document.querySelector('.movies').classList.add('hidden')

    //Initialize FirebaseUI Auth
    let ui = new firebaseui.auth.AuthUI(firebase.auth())

    //FirebaseUI configuration
    let authUIConfig = {
    signInOptions: [
      firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    signInSuccessUrl: 'movies.html'
    }

    // Starts FirebaseUI Auth
    ui.start('.sign-in-or-sign-out', authUIConfig)
  }

})

// Step 3: Setting the TMDB movie ID as the document ID on your "watched" collection
//         will no longer work. The document ID should now be a combination of the
//         TMDB movie ID and the user ID indicating which user has watched. 
//         This "composite" ID could simply be `${movieId}-${userId}`. This should 
//         be set when the "I've watched" button on each movie is clicked. Likewise, 
//         when the list of movies loads and is shown on the page, only the movies 
//         watched by the currently logged-in user should be opaque.