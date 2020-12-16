import { fetchSampleData } from "../../App/Data/mockApi";
import {
	TEST_ACTION,
	DELETE_EVENT,
	OPEN_MODAL,
	CLOSE_MODAL,
	ASYNC_ACTION_START,
	ASYNC_ACTION_FINISH,
	ASYNC_ACTION_ERROR,
	FETCH_EVENTS,
} from "./types";
import { toastr } from "react-redux-toastr";
import history from "../../history";
import { SubmissionError } from "redux-form";
import { createNewEvent } from "../../App/Util/helpers";
import userPNG from "../../Assets/user.png";
import { getFirebase } from "react-redux-firebase";

// Test Actions
export const testAction = () => {
	return {
		type: TEST_ACTION,
	};
};

export const testActionAsync = () => {
	return async (dispatch) => {
		dispatch(asyncActionStart());
		await delay(1000);
		dispatch(testAction());
		dispatch(asyncActionFinish());
	};
};

// Events Actions
export const createEvent = (event) => {
	return async (dispatch, getState) => {
		const firebase = getFirebase();
		const firestore = firebase.firestore();

		const user = firebase.auth().currentUser;
		// const photoURL = getState().firebase.profile.photoURL;
		const photoURL = user.photoURL;
		const newEvent = createNewEvent(user, photoURL, event);
		try {
			let createdEvent = await firestore
				.collection("events")
				.add(newEvent);

			await firestore
				.collection("event_attendee")
				.doc(`${createdEvent.id}_${user.uid}`)
				.set({
					eventId: createdEvent.id,
					userUid: user.uid,
					eventDate: event.date,
					host: true,
					category: event.category,
				});

			toastr.success("Success!!! ", "Event has been created");
			return createdEvent;
		} catch (error) {
			toastr.error("Oops", "Something went wrong");
		}
	};
};

export const updateEvent = (event, eventId) => {
	return async (dispatch) => {
		const firebase = getFirebase();
		const firestore = firebase.firestore();

		try {
			await firestore.collection("events").doc(`${eventId}`).set(event);
			toastr.success("Success!!! ", "Event has been updated");
		} catch (error) {
			toastr.error("Oops", "Something went wrong");
		}
	};
};

export const joinEvent = (event) => {
	return async (dispatch) => {
		const firebase = getFirebase();
		const firestore = firebase.firestore();
		const user = firebase.auth().currentUser;
		// const photoURL = getState().firebase.profile.photoURL;
		const photoURL = user.photoURL;

		const newAttendee = {
			id: user.uid,
			going: true,
			joinDate: new Date(),
			photoURL: photoURL || userPNG,
			displayName: user.displayName,
			host: false,
		};

		try {
			await firestore
				.collection("events")
				.doc(`${event.id}`)
				.update({ [`attendees.${user.uid}`]: newAttendee });

			await firestore
				.collection("event_attendee")
				.doc(`${event.id}_${user.uid}`)
				.set({
					eventId: event.id,
					userUid: user.uid,
					eventDate: event.date,
					host: false,
					category: event.category,
				});

			toastr.success("Success!!! ", "You successfully joined the event");
		} catch (error) {
			toastr.error("Oops", "Something went wrong");
		}
	};
};

export const cancelJoiningEvent = (event) => {
	return async (dispatch) => {
		const firebase = getFirebase();
		const firestore = firebase.firestore();
		const user = firebase.auth().currentUser;

		try {
			await firestore
				.collection("events")
				.doc(`${event.id}`)
				.update({
					[`attendees.${user.uid}`]: firebase.firestore.FieldValue.delete(),
				});

			await firestore
				.collection("event_attendee")
				.doc(`${event.id}_${user.uid}`)
				.delete();

			toastr.success(
				"Success!!! ",
				"You have removed yourself from the event"
			);
		} catch (error) {
			console.log(error);
			toastr.error("Oops", "Something went wrong");
		}
	};
};

export const deleteEvent = (eventId) => {
	return {
		type: DELETE_EVENT,
		payload: {
			eventId,
		},
	};
};

export const getEventsForDashboard = (lastEvent) => async (
	dispatch,
	getState
) => {
	let today = new Date();
	const firestore = getFirebase().firestore();
	const eventRef = firestore.collection("events");
	try {
		dispatch(asyncActionStart());
		let startAfter = lastEvent && (await eventRef.doc(lastEvent.id).get());
		let query;
		if (lastEvent)
			query = eventRef
				.where("date", ">=", today)
				.orderBy("date")
				.startAfter(startAfter)
				.limit(2);
		else
			query = eventRef
				.where("date", ">=", today)
				.orderBy("date")
				.limit(2);

		let querySnap = await query.get();

		if (querySnap.docs.length === 0) {
			dispatch(asyncActionFinish());
			return querySnap;
		}

		let events = [];
		for (let index = 0; index < querySnap.docs.length; index++) {
			const event = {
				...querySnap.docs[index].data(),
				id: querySnap.docs[index].id,
			};
			events.push(event);
		}
		dispatch({ type: FETCH_EVENTS, payload: { events } });
		dispatch(asyncActionFinish());
		return querySnap;
	} catch (error) {
		console.log(error);
		dispatch(asyncActionError());
	}
};

// Modal Actions
export const openModal = (modalType, modalProps) => {
	return {
		type: OPEN_MODAL,
		payload: {
			modalType,
			modalProps,
		},
	};
};

export const closeModal = () => {
	return {
		type: CLOSE_MODAL,
	};
};

// Async Actions
export const asyncActionStart = () => {
	return {
		type: ASYNC_ACTION_START,
	};
};

export const asyncActionFinish = () => {
	return {
		type: ASYNC_ACTION_FINISH,
	};
};

export const asyncActionError = () => {
	return {
		type: ASYNC_ACTION_ERROR,
	};
};

// Auth Actions
// Auth Actions
export const login = ({ firebase }, creds) => async (dispatch) => {
	try {
		await firebase
			.auth()
			.signInWithEmailAndPassword(creds.email, creds.password);

		history.push("/events");
		// history.go(0);
	} catch (error) {
		let msg;
		const cases = [
			"There is no user record corresponding to this identifier. The user may have been deleted.",
			"The email address is badly formatted.",
			"The password is invalid or the user does not have a password.",
		];
		switch (error.message) {
			case cases[0]:
				msg =
					"The email address you have entered is not registered with this app";

				break;
			case cases[1]:
				msg = "Please check your email address";

				break;
			case cases[2]:
				msg = "Invalid Password";

				break;
			default:
				break;
		}

		throw new SubmissionError({
			_error: msg,
		});
	}
};

export const registerUser = ({ firebase, firestore }, creds) => async (
	dispatch
) => {
	try {
		//creating a user in auth
		let createdUser = await firebase
			.auth()
			.createUserWithEmailAndPassword(creds.email, creds.password);

		//updates the auth profile
		await createdUser.user.updateProfile({
			displayName: creds.firstName + " " + creds.lastName,
		});

		//creating new profile in firestore
		let newUser = {
			displayName: createdUser.user.displayName,
			email: createdUser.user.email,
			createdAt: Date.now(),
			uid: createdUser.user.uid,
		};

		// adding new user in users collection
		await firebase
			.firestore()
			.collection("users")
			.doc(createdUser.user.uid)
			.set(newUser);

		history.push("/events");
		// history.go(0);
	} catch (error) {
		throw new SubmissionError({
			_error: error.message,
		});
	}
};

export const socialLogin = ({ firebase }, selectedProvider) => async (
	dispatch
) => {
	try {
		const user = await firebase.login({
			provider: selectedProvider,
			type: "popup",
		});

		if (user !== undefined && user.additionalUserInfo.isNewUser) {
			await firebase
				.firestore()
				.collection("users")
				.doc(user.user.uid)
				.set({
					displayName: user.user.displayName,
					email: user.user.email,
					photoURL: user.user.photoURL || null,
					createdAt: Date.now(),
					uid: user.user.uid,
				});
		}

		history.push("/events");
		// history.go(0);
	} catch (error) {}
};

export const updateUserProfilePhoto = (
	{ firebase },
	downloadURL,
	filename
) => async (dispatch) => {
	const user = firebase.auth().currentUser;
	const userDocRef = firebase.firestore().collection("users").doc(user.uid);
	try {
		const userDoc = await userDocRef.get();
		if (!userDoc.data().photoURL) {
			await firebase
				.firestore()
				.collection("users")
				.doc(user.uid)
				.update({
					photoURL: downloadURL,
				});
			await user.updateProfile({
				photoURL: downloadURL,
			});
		}
		return await firebase
			.firestore()
			.collection("users")
			.doc(user.uid)
			.collection("photos")
			.add({
				name: filename,
				url: downloadURL,
			});
	} catch (error) {
		throw error;
	}
};

export const deletePhoto = ({ firebase }, fileName, id) => async (dispatch) => {
	const uid = firebase.auth().currentUser.uid;
	const storageRef = firebase.storage().ref();
	const photoRef = storageRef.child(`${uid}/user_images/${fileName}`);
	try {
		await photoRef.delete();
		await firebase
			.firestore()
			.collection("users")
			.doc(uid)
			.collection("photos")
			.doc(id)
			.delete();
	} catch (error) {
		toastr.error(error.message);
		throw error;
	}
};

export const setMainPhoto = ({ firebase }, url) => async (dispatch) => {
	try {
		const user = firebase.auth().currentUser;
		await firebase.firestore().collection("users").doc(user.uid).update({
			photoURL: url,
		});
	} catch (error) {
		toastr.error(error.message);
		throw error;
	}
};

export const updateEventPhoto = ({ firebase }, downloadURL, eventId) => async (
	dispatch
) => {
	try {
		await firebase.firestore().collection("events").doc(eventId).update({
			photoURL: downloadURL,
		});
	} catch (error) {
		console.log(error);
		toastr.error("Oops", "Something went wrong");
	}
};

export const addEventComment = (firebase, eventId, values, parentId) => async (
	dispatch,
	getState
) => {
	try {
		const user = getState().firebase.profile;
		const photoURL = user.photoURL;
		const displayName = user.displayName;
		// const photoURL = user.photoURL || userPNG;
		// const displayName = user.displayName;

		const newComment = {
			displayName,
			photoURL,
			parentId,
			uid: user.uid,
			text: values.comment,
			date: Date.now(),
			id: user.uid + Date.now(),
		};

		await firebase.push(`event_chat/${eventId}`, newComment);
		toastr.success("Success!!! ", "Comment added successfully");
	} catch (error) {
		console.log(error);
		toastr.error("Oops", "Something went wrong");
	}
};

const delay = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};
