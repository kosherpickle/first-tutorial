import Unsplash, { toJson } from 'unsplash-js';

const unsplash = new Unsplash({
	applicationId: "547dab915d0c601966b6be97b9b5aebe8addcf0e79815f9ff6cb0f5d20015420",
	secret: "1784e45126edf839ee8c3be8c9e1e151d35edad08bfa34cd635a0df844088df1",
	callbackUrl: "urn:ietf:wg:oauth:2.0:oob"
});

const authenticationURL = unsplash.auth.getAuthenticationUrl([
	// scopes go here e.g. "public", "read_user"
]);


window.onload = function () {

	const mainContainer = document.getElementById('main-container');
	var photosInformation = [];

	unsplash.photos.searchPhotos("yacht")
		.then(toJson)
		.then(json => {
			json.map((photo, index) => {
				// adds a new object on the array
				photosInformation.push(new Object());
				
				// if the photographer has a last name, add first and last
				// else just add first
				if (photo.user.last_name) {
					photosInformation[index].photographerName = photo.user.first_name + " " + photo.user.last_name;
				} else {
					photosInformation[index].photographerName = photo.user.first_name;
				}

				// adds the profile url
				photosInformation[index].photographerProfileURL = photo.user.links.html;

				// adds the photo url ***** there are other options than just regular *****
				photosInformation[index].photoURL = photo.urls.regular;

			});
		})
		.then( () => {
			console.log(photosInformation);
			
		})

	


//	photosInformation.map((photo, index) => {
//		mainContainer.innerHTML
//	});

// photos should have "Photo by X" with a link back to Unsplash profile


}