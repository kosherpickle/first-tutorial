require('isomorphic-fetch');
import Unsplash, { toJson } from 'unsplash-js';
import $ from 'jquery';


var totals = {
	pageIndex: 0,
	totalNumber: 0,
	totalPages: 0,
	searchTerm: "search term",
};

const unsplash = new Unsplash({
	applicationId: "547dab915d0c601966b6be97b9b5aebe8addcf0e79815f9ff6cb0f5d20015420",
	secret: "1784e45126edf839ee8c3be8c9e1e151d35edad08bfa34cd635a0df844088df1",
	callbackUrl: "urn:ietf:wg:oauth:2.0:oob"
});

const authenticationURL = unsplash.auth.getAuthenticationUrl([
	// scopes go here e.g. "public", "read_user"
]);

// creates an image element with the ID of imageID and the SRC of imageSRC and
// places it within the element with the ID of wrapperID
function makeImageElement (wrapperID, imageSRC, imageID, imageClass) {
	let wrapper = document.getElementById(wrapperID);
	let image = document.createElement("img");
	if (imageID) {
		image.setAttribute("id", imageID);
	}
	if (imageClass) {
		image.setAttribute("class", imageClass);
	}
	image.src = imageSRC;
	wrapper.appendChild(image);
}

function makeDivElement (wrapperID, divID, divClass) {
	let wrapper = document.getElementById(wrapperID);
	let container = document.createElement("div");
	if (divID) {
		container.setAttribute("id", divID);
	}
	if (divClass) {
		container.setAttribute("class", divClass);
	}
	wrapper.appendChild(container);
}

function makeAnchorElement (wrapperID, anchorURL, anchorID, anchorClass) {
	let wrapper = document.getElementById(wrapperID);
	let anchor = document.createElement("a");
	anchor.href = anchorURL;
	if (anchorID) {
		anchor.setAttribute("id", anchorID);
	}
	if (anchorClass) {
		anchor.setAttribute("class", anchorClass);
	}
	wrapper.appendChild(anchor);
}

function makeParagraphElement(wrapperID, content, pID, pClass) {
	let wrapper = document.getElementById(wrapperID);
	let paragraph = document.createElement("p");
	paragraph.innerHTML = content;
	if (pID) {
		paragraph.setAttribute("id", pID);
	}
	if (pClass) {
		paragraph.setAttribute("class", pClass);
	}
	wrapper.appendChild(paragraph);
}

function makeFormElement(wrapperID, formID, formClass) {
	let wrapper = document.getElementById(wrapperID);
	let form = document.createElement("form");
	if (formID) {
		form.setAttribute("id", formID);
	}
	if (formClass) {
		form.setAttribute("class", formClass);
	}
	wrapper.appendChild(form);
}

function makeInputElement(wrapperID, inputID, inputClass) {
	let wrapper = document.getElementById(wrapperID);
	let input = document.createElement("input");
	if (inputID) {
		input.setAttribute("id", inputID);
	}	
	if (inputClass) {
		input.setAttribute('class', inputClass);
	}
	wrapper.appendChild(input);
}

function makeButtonElement(wrapperID, buttonText, buttonID, buttonClass) {
	let wrapper = document.getElementById(wrapperID);
	let button = document.createElement("button");
	button.innerHTML = buttonText;
	if (buttonID) {
		button.setAttribute("id", buttonID);
	}	
	if (buttonClass) {
		button.setAttribute('class', buttonClass);
	}
	wrapper.appendChild(button);
}

// this renders the search page
// additionalText is a string that you can add above the search input (as we do for a failed search)
function renderSearchPage(additionalText) {
	const mainContainer = document.getElementById('main-container');

	// makes initial wrapper div for search
	makeDivElement("main-container", "search-wrapper");

	// add additionalText if there is any
	if (additionalText) {
		makeDivElement("search-wrapper", "additional-text-wrapper");
		makeParagraphElement("additional-text-wrapper", additionalText, "additional-text");
	}

	// insert search form
	makeFormElement("search-wrapper", "search-form");

	// insert search input
	makeDivElement("search-form", "search-input-wrapper");
	makeInputElement("search-input-wrapper", "search-input");

	// insert search button
	makeDivElement("search-form", "search-button-wrapper");
	makeButtonElement("search-button-wrapper", "Search Images", "search-button");

	// feels kind of dirty - but this is our router from the search page to the results page
	document.getElementById("search-button").onclick = () => {
		let searchTerm = document.getElementById("search-input").value;
		clearPage();
		renderResultsPage(searchTerm);
	};
}

// this clears the main-container, allowing us a fresh page
function clearPage() {
	$("#main-container").empty();
}

function sizeImage(image) {
	let viewWidth = window.innerWidth;
	let viewHeight = window.innerHeight;
	let imageHeight = image.height;
	let imageWidth = image.width;

	// this is the size of the image container, reserving 100px for the footer
	let imageContainerHeight = viewHeight - 100;

	let viewAspect = viewWidth / imageContainerHeight;
	let imageAspect = imageWidth / imageHeight;

	if (imageAspect >= viewAspect) {
		image.style.height = (viewWidth / imageAspect) + "px";
		image.style.width = viewWidth + "px";
	}
	else {
		image.style.width = (imageContainerHeight * imageAspect) + "px";
		image.style.height = imageContainerHeight + "px";
	}
}

function centerImage(image) {
	let viewWidth = window.innerWidth;
	let viewHeight = window.innerHeight;
	viewHeight = viewHeight - 100;
	let imageHeight = parseInt(image.style.height, 10);
	let imageWidth = parseInt(image.style.width, 10);
	image.style.marginLeft = ((viewWidth - imageWidth) / 2) + "px";
	image.style.marginTop = ((viewHeight - imageHeight) / 2) + "px";
}

function nextImage(index) {
	document.getElementById("entity-wrapper-" + index).style.display = "none";
	document.getElementById("entity-wrapper-" + (index + 1)).style.display = "block";

	// if we are halfway through the most recent ten photos, go get ten more
	if (index % 5 === 0 && index % 10 !== 0) {
		totals.pageIndex++;
		getTenPhotos(totals.searchTerm, totals.pageIndex, 10);
	}
}

function previousImage(index) {
	document.getElementById("entity-wrapper-" + index).style.display = "none";
	document.getElementById("entity-wrapper-" + (index - 1)).style.display = "block";
}

// this gets 10 photos for the search term
// searchTerm is the search term; page is the page number that we are on; number is how many to get on each page (default 10)
function getTenPhotos(searchTerm, page, number) {
	var photosInformation = [];
	var totalNumber;
	var totalPages;

	unsplash.search.photos(searchTerm, page, number)
		.then(toJson)
		.then(json => {
			// if search results in no answers
			if (json.total === 0) {
				return;
			}

			totalNumber = json.total;
			totals.totalNumber = json.total;
			totalPages = json.total_pages;
			totals.totalPages = json.total_pages;

			json.results.map((photo, index) => {
				// this section sets up the object of information (photoURL, photographerName, photographerProfileURL, lastPhoto)

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

				photosInformation[index].lastPhoto = false;

			});
		})
		.then( () => {
			photosInformation.map((photo, index) => {
				// this section makes all the HTML for the photos


				let adjustedIndex = index + (10 * (totals.pageIndex - 1));
				if (totals.pageIndex == 0) {
					adjustedIndex = index + (10 * (totals.pageIndex));				
				}

				// make div that the entire photo and footer will go in
				makeDivElement("main-container", ("entity-wrapper-" + adjustedIndex), "entity-wrapper");
				// make div that photo will go in
				makeDivElement(("entity-wrapper-" + adjustedIndex), ("photo-wrapper-" + adjustedIndex), "photo-wrapper");
				// make the actual image
				makeImageElement(("photo-wrapper-" + adjustedIndex), photo.photoURL, ("photo-" + adjustedIndex), "photo");
				
				// make the container for the photograph footer
				makeDivElement(("entity-wrapper-" + adjustedIndex), ("photo-footer-" + adjustedIndex), "photo-footer");

				// if it is not the first photograph, make the div for the left-hand arrow
				if (adjustedIndex > 0) {
					makeDivElement(("photo-footer-" + adjustedIndex), ("left-arrow-" + adjustedIndex), "left-arrow");
					// add onclick event
					document.getElementById(("left-arrow-" + adjustedIndex)).onclick = () => {
						previousImage(adjustedIndex);
					};
				}

				// create the div that will hold the photographer name
				makeDivElement(("photo-footer-" + adjustedIndex), ("photographer-wrapper-" + adjustedIndex), "photographer-wrapper");
				// make the link to the photographer profile
				makeAnchorElement(("photographer-wrapper-" + adjustedIndex), photo.photographerProfileURL, ("photographer-anchor-" + adjustedIndex), "photographer-anchor");
				// make the photographer name text
				document.getElementById("photographer-anchor-" + adjustedIndex).innerHTML = "Photo by " + photo.photographerName;

				// if it is not the last photo in the group, then make a right-hand arrow
				if (!((adjustedIndex + 1) === totalNumber)) {
					makeDivElement(("photo-footer-" + adjustedIndex), ("right-arrow-" + adjustedIndex), "right-arrow");
					// add onclick event
					document.getElementById(("right-arrow-" + adjustedIndex)).onclick = () => {
						nextImage(adjustedIndex);
					};
				}

				// size the images to the screen with the footer
				let image = document.getElementById("photo-" + adjustedIndex);
				image.onload = function () {
					sizeImage(image);
					centerImage(image);
				}
			});	
		})
		.then( () => {
			// if this is the first 10 results, up the pageIndex; otherwise the pageIndex gets increased through the onClick event - function nextImage()
			if (totals.pageIndex == 0) {
				totals.pageIndex = 1;
			}
			// if there are no results, call the search page again with some error text
			if (totals.totalNumber === 0) {
				clearPage();
				renderSearchPage("There are no photos for your search term: " + searchTerm + ". Try a different search.");
			}
		})

}

// this is only called immediately after the search button has been pressed
function renderResultsPage (searchTerm) {
	const mainContainer = document.getElementById('main-container');
	totals.searchTerm = searchTerm;
	getTenPhotos(searchTerm, 1, 10);

}

window.onload = function () {
	renderSearchPage();
}

