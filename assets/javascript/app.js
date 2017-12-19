// Initialize Firebase
  var config = {
    apiKey: "AIzaSyAq9Be183210HH_DUXTHtYnLWQtJ-1wzE8",
    authDomain: "trainschedulebonus.firebaseapp.com",
    databaseURL: "https://trainschedulebonus.firebaseio.com",
    projectId: "trainschedulebonus",
    storageBucket: "",
    messagingSenderId: "303897037385"
  };
  firebase.initializeApp(config);

// Create a variable to reference the database.
var database = firebase.database();
var tMinutesTillTrain = 0;
var nextTrain = "";
var newPostKey = "";
var name = "";
var destination = "";
var firstTime = "";
var frequency = "";

$("#add-data").on("click", function(event) {
  event.preventDefault();
  //values from text boxes
  name = $("#name-input").val().trim();
  destination = $("#destination-input").val().trim();
  firstTime = $("#first-time-input").val().trim();
  console.log("firstTime: ", firstTime)
  frequency = $("#frequency-input").val().trim();


 calculateTime()

 database.ref().push({
   name: name,
   destination: destination,
   firstTime: firstTime,
   frequency: frequency,
   tMinutesTillTrain: tMinutesTillTrain,
   nextTrain: nextTrain,
   uid: newPostKey
 });

  createRemoveButtons()
});

// Firebase watcher + initial loader + order/limit HINT: .on("child_added"
database.ref().on("child_added", function(snapshot) {
  // storing the snapshot.val() in a variable for convenience
  var sv = snapshot.val();

  // Console.loging the last user's data
  console.log(sv.name);
  console.log(sv.destination);
  console.log(sv.firstTime);
  console.log(sv.frequency);
  console.log(sv.nextTrain);
  console.log(sv.tMinutesTillTrain);
  console.log(sv.uid);
  // Change the HTML to reflect

  $("#tableBody").append('<tr class="trains"> <td>' + sv.name + "</td>" + "<td>" + sv.destination + "</td>" + "<td>"
  + sv.frequency + "</td>" + '<td class="next-train">' + sv.nextTrain + "</td>" + '<td class="minutes-till-train">' + sv.tMinutesTillTrain + "</td> " + '<td class="buttonTd"></td></tr>');

  createRemoveButtons()

  // Handle the errors
}, function(errorObject) {
  console.log("Errors handled: " + errorObject.code);
});//push data into the firebase

function calculateTime(){
  // First Time (pushed back 1 year to make sure it comes before current time)
  var firstTimeConverted = moment(firstTime, "hh:mm").subtract(1, "years");
  console.log("firstTimeConverted: ", firstTimeConverted, typeof(firstTimeConverted));

  // Current Time
  var currentTime = moment();
  console.log("CURRENT TIME: " + moment(currentTime).format("hh:mm"));

  // Difference between the times
  var diffTime = moment().diff(moment(firstTimeConverted), "minutes");
  console.log("DIFFERENCE IN TIME: " + diffTime, typeof(diffTime));

  // Time apart (remainder)
  var tRemainder = diffTime % frequency;
  console.log("tRemainder: ", tRemainder, typeof(tRemainder));
  //console.log("tRemainder: ", typeOf(tRemainder))

  // Minute Until Train
  tMinutesTillTrain = frequency - tRemainder;
  console.log("MINUTES TILL TRAIN: " + tMinutesTillTrain);

  // Next Train
  nextTrain = moment().add(tMinutesTillTrain, "minutes");
  console.log("ARRIVAL TIME: " + moment(nextTrain).format("hh:mm"));
  nextTrain =  moment(nextTrain).format("hh:mm A")

  console.log("nextTrain: ",   nextTrain)


  // the push
  newPostKey = firebase.database().ref().child("trainschedulebonus").push().key;
  console.log("newPostKey: ", newPostKey)

}//close function calculateTime


function createRemoveButtons() {
  var arrayOfChildKey = [];
  database.ref().once("value", function(snapshot){
    snapshot.forEach(function(childSnapshot){
      var childKey = childSnapshot.key;
      arrayOfChildKey.push(childKey);
      console.log("childKey: ", childKey)
    });//retrive the key of child

    console.log("arrayOfChildKey: ", arrayOfChildKey)
    $(".buttonTd").empty()
    $.each(arrayOfChildKey, function(index, key){
      var $removeButton = $("<button/>");
      $removeButton.addClass("btn btn-danger remove");
      $removeButton.attr("data-id", key);
      $removeButton.attr("data-index", index);
      $removeButton.text("Remove")
        $(".buttonTd").each(function(i){
          if (i == index) {
            $(this).append($removeButton);
          };
        });
        $(".minutes-till-train").each(function(i){
          if (i == index) {
            $(this).attr("id", key);
          };
        });
        $(".next-train").each(function(i){
          if (i == index) {
            $(this).attr("id", key);
          };
        });
    });//for each buttonRemove
  });//once value database
};


$("#tableBody").on("click", ".remove", function(event){
  event.preventDefault();
  var dataId = $(this).attr("data-id");
  console.log("dataId: ", dataId)
  $(this).closest('tr').remove();

  database.ref(dataId).remove();
});

setInterval(function(){
  database.ref().once("value", function(snapshot){
    snapshot.forEach(function(childSnapshot) {
        firstTime = childSnapshot.val().firstTime;
        frequency = childSnapshot.val().frequency;
        tMinutesTillTrain = childSnapshot.val().tMinutesTillTrain;
        console.log("tMinutesTillTrain BEFORE update", tMinutesTillTrain)
        calculateTime()
        console.log("tMinutesTillTrain AFTER recalc", tMinutesTillTrain)
        database.ref("/" + childSnapshot.key + "/tMinutesTillTrain/").remove();
        database.ref("/" + childSnapshot.key + "/").update({
          tMinutesTillTrain: tMinutesTillTrain
        });
        database.ref("/" + childSnapshot.key + "/nextTrain/").remove();
        database.ref("/" + childSnapshot.key + "/").update({
          nextTrain: nextTrain
        });
        console.log("UPDATE TEXT EVERY MIN tMinutesTillTrain: ", childSnapshot.val().tMinutesTillTrain)
        $(".minutes-till-train#" + childSnapshot.key + "").text(tMinutesTillTrain);
        console.log("UPDATE TEXT EVERY MIN tMinutesTillTrain variable After the calc: ", tMinutesTillTrain)
        $(".next-train#" + childSnapshot.key + "").text(nextTrain);
        console.log("UPDATE TEXT EVERY MIN", $("#" + childSnapshot.key + ""))
      });
  });
}, 60 * 1000);
