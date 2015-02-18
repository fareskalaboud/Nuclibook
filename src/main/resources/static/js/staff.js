var validateEditForm = function (formObject) {
	var error = false;

	// check name
	if (formObject.name.length < 1) {
		toastr.error("You did not enter a valid name");
		error = true;
	}

	// check username
	if (formObject.username.length < 1) {
		toastr.error("You did not enter a valid username");
		error = true;
	}

	return !error;
};

var validateCreateForm = function (formObject) {
	var error = false;

	// check name
	if (formObject.name.length < 1) {
		toastr.error("You did not enter a valid name");
		error = true;
	}

	// check username
	if (formObject.username.length < 1) {
		toastr.error("You did not enter a valid username");
		error = true;
	}

	// check password length
	if (formObject.password.length < 4) {
		toastr.error("Your password must be at least 4 characters long");
		error = true;
	}

	// check password match
	if (formObject.password != formObject.password_check) {
		toastr.error("Your passwords did not match");
		error = true;
	}

	return !error;
};