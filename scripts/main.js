//Global variable pointing to the current user's Firestore document
var currentUser;

function insertNameFromFirestore() {
    // Check if the user is logged in:
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log(user.uid); // Let's know who the logged-in user is by logging their UID
            currentUser = db.collection("users").doc(user.uid); // Go to the Firestore document of the user
            currentUser.get().then(userDoc => {
                // Get the user name
                var userName = userDoc.data().name;
                console.log(userName);
                //$("#name-goes-here").text(userName); // jQuery
                document.getElementById("name-goes-here").innerText = userName;
            })
        } else {
            console.log("No user is logged in."); // Log a message when no user is logged in
        }
    })
}

// insertNameFromFirestore();

function readQuote(day) {
    db.collection("quotes").doc(day).onSnapshot(dayInfo => {
        console.log(dayInfo.data())
        quoteOfTheDay = dayInfo.data().quote;
        document.getElementById("quote-goes-here").innerHTML = quoteOfTheDay;
    })
}

// readQuote("tuesday")

function writeHikes() {
    //define a variable for the collection you want to create in Firestore to populate data
    var hikesRef = db.collection("hikes");

    hikesRef.add({
        code: "BBY01",
        name: "Burnaby Lake Park Trail", //replace with your own city?
        city: "Burnaby",
        province: "BC",
        level: "easy",
        details: "A lovely place for lunch walk",
        length: 10,          //number value
        hike_time: 60,       //number value
        lat: 49.2467097082573,
        lng: -122.9187029619698,
        last_updated: firebase.firestore.FieldValue.serverTimestamp()  //current system time
    });
    hikesRef.add({
        code: "AM01",
        name: "Buntzen Lake Trail", //replace with your own city?
        city: "Anmore",
        province: "BC",
        level: "moderate",
        details: "Close to town, and relaxing",
        length: 10.5,      //number value
        hike_time: 80,     //number value
        lat: 49.3399431028579,
        lng: -122.85908496766939,
        last_updated: firebase.firestore.Timestamp.fromDate(new Date("March 10, 2022"))
    });
    hikesRef.add({
        code: "NV01",
        name: "Mount Seymour Trail", //replace with your own city?
        city: "North Vancouver",
        province: "BC",
        level: "hard",
        details: "Amazing ski slope views",
        length: 8.2,        //number value
        hike_time: 120,     //number value
        lat: 49.38847101455571,
        lng: -122.94092543551031,
        last_updated: firebase.firestore.Timestamp.fromDate(new Date("January 1, 2023"))
    });
}

//------------------------------------------------------------------------------
// Input parameter is a string representing the collection we are reading from
//------------------------------------------------------------------------------
function displayCardsDynamically(collection) {
    let cardTemplate = document.getElementById("hikeCardTemplate"); // Retrieve the HTML element with the ID "hikeCardTemplate" and store it in the cardTemplate variable. 

    db.collection(collection).orderBy("length").get()   //the collection called "hikes"
        .then(allHikes => {
            //var i = 1;  //Optional: if you want to have a unique ID for each hike
            allHikes.forEach(doc => { //iterate thru each doc
                var title = doc.data().name;       // get value of the "name" key
                var details = doc.data().details;  // get value of the "details" key
                var hikeCode = doc.data().code;    //get unique ID to each hike to be used for fetching right image
                var hikeLength = doc.data().length; //gets the length field
                var docID = doc.id;
                let newcard = cardTemplate.content.cloneNode(true); // Clone the HTML template to create a new card (newcard) that will be filled with Firestore data.

                //update title and text and image
                newcard.querySelector('.card-title').innerHTML = title;
                newcard.querySelector('.card-length').innerHTML = hikeLength + "km";
                newcard.querySelector('.card-text').innerHTML = details;
                newcard.querySelector('.card-image').src = `./images/${hikeCode}.jpg`; //Example: NV01.jpg
                newcard.querySelector('a').href = "eachHike.html?docID=" + docID;
                newcard.querySelector('i').id = 'save-' + docID; // assigning unique id to each element
                newcard.querySelector('i').onclick = () => saveBookmark(docID)

                currentUser.get().then(userDoc => {
                    //get the user name
                    var bookmarks = userDoc.data().bookmarks;
                    if (bookmarks.includes(docID)) {
                        document.getElementById('save-' + docID).innerText = 'bookmark';
                    }
                    else {
                        document.getElementById('save-' + docID).innerText = 'bookmark_border';
                    }
                })

                //Optional: give unique ids to all elements for future use
                // newcard.querySelector('.card-title').setAttribute("id", "ctitle" + i);
                // newcard.querySelector('.card-text').setAttribute("id", "ctext" + i);
                // newcard.querySelector('.card-image').setAttribute("id", "cimage" + i);
                newcard.querySelector('.card-length').innerHTML =
                    "Length: " + doc.data().length + " km <br>" +
                    "Duration: " + doc.data().hike_time + "min <br>" +
                    "Last updated: " + doc.data().last_updated.toDate().toLocaleDateString();
                //attach to gallery, Example: "hikes-go-here"
                document.getElementById(collection + "-go-here").appendChild(newcard);

                //i++;   //Optional: iterate variable to serve as unique ID
            })
        })
}

// displayCardsDynamically("hikes");  //input param is the name of the collection

function saveBookmark(hikeID) {
    // console.log("Save bookmark clicked")
    // handle the backend: save the hikeID in the firestore
    hikeInclude = document.getElementById('save-' + hikeID).innerText
    if (hikeInclude == 'bookmark') {
        currentUser.update({
            bookmarks: firebase.firestore.FieldValue.arrayRemove(hikeID,)
        }).then(() => {
            console.log("bookmark unsaved for " + hikeID)
            // handle the front end and change the icon to bookmark filled
            let iconID = 'save-' + hikeID;
            document.getElementById(iconID).innerText = 'bookmark_border'
        })

    }
    else {
        currentUser.update({
            bookmarks: firebase.firestore.FieldValue.arrayUnion(hikeID,)
        }).then(() => {
            console.log("bookmark saved for " + hikeID)
            // handle the front end and change the icon to bookmark filled
            let iconID = 'save-' + hikeID;
            document.getElementById(iconID).innerText = 'bookmark'
        })
    }
}



//Function that calls everything needed for the main page  
function doAll() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            currentUser = db.collection("users").doc(user.uid); //global
            console.log(currentUser);

            // figure out what day of the week it is today
            const weekday = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
            const d = new Date();
            let day = weekday[d.getDay()];

            // the following functions are always called when someone is logged in
            readQuote(day);
            insertNameFromFirestore();
            displayCardsDynamically("hikes");
        } else {
            // No user is signed in.
            console.log("No user is signed in");
            window.location.href = "login.html";
        }
    });
}
doAll();

// function updateBookmark(hikeID){
//     currentUser.get().then(userDoc=>{
//         let bookmarks = userDoc.data().bookmarks;
//         let iconID = "save-" + hikeID
//         let isBookmarked = bookmarks.includes(hikeID);
        
//         if (isBookmarked) {
//             currentUser.update({
//                 bookmarks: firebase.firestore.FieldValue.arrayRemove(hikeID,)
//             }).then(() => {
//                 console.log("bookmark unsaved for " + hikeID)
//                 // handle the front end and change the icon to bookmark filled
//                 document.getElementById(iconID).innerText = 'bookmark_border'
//             })

//         }
//         else {
//             currentUser.update({
//                 bookmarks: firebase.firestore.FieldValue.arrayUnion(hikeID,)
//             }).then(() => {
//                 console.log("bookmark saved for " + hikeID)
//                 // handle the front end and change the icon to bookmark filled
//                 document.getElementById(iconID).innerText = 'bookmark'
//             })
//         }
//     })
// }