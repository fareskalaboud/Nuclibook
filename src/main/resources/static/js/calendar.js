var calendarEvents = [];

var currentOptions = {};

var selectedCameras = null;

var calendarChannelOptions = {
	bookings: true,
	staffAbsences: true,
	genericEvents: true
};

function setupCalendar(selector, onSelect, viewOptions) {
	var cal = selector.show().fullCalendar({
		// basic appearance
		header: {
			left: 'prev,next today',
			center: 'title',
			right: ''
		},
		defaultView: 'agendaWeek',
		selectable: viewOptions['selectable'],
		selectHelper: true,
		allDaySlot: false,
		timeFormat: 'HH:mm',
		weekends: true,
		firstDay: 1,
		slotMinutes: 15,

		// set data source
		events: calendarEvents,

		// set time limits and position on the calendar
		minTime: "00:00:00",
		maxTime: "24:00:00",

		// what to display?
		viewDisplay: function (e) {
			// clear bookings
			calendarEvents.length = 0;

			// reload for new date range
			updateCalendar(selector, e.start, e.end, viewOptions);

			// resize
			var v = this;
			e.setHeight($(window).height() - $(v).position().top - 60);
			setTimeout(function () {
				e.setHeight($(window).height() - $(v).position().top - 60);
			}, 500);
		},

		// on-select function
		select: onSelect,

		// pop-up with details
		eventRender: function (event, element) {
			element.addClass(event.type);

			element.popover({
				title: event.title,
				placement: 'auto',
				html: true,
				trigger: 'hover',
				animation: 'true',
				content: event.msg,
				container: 'body'
			});

			// click listener to hide
			$('body').on('click', function (e) {
				if (!element.is(e.target) && element.has(e.target).length === 0
					&& $('.popover').has(e.target).length === 0)
					element.popover('hide');
			});
		},

		eventClick: function (calEvent, jsEvent, view) {
			if (calEvent.url && viewOptions['linkEvents']) {

				window.location.href = calEvent.url;
			}
			return false;
		},

		windowResize: function (calView) {
			calView.setHeight($(window).height() - $(this).position().top - 60);
		}
	});

	// add loading icon and toggle buttons
	cal.find('.fc-header-right').html('' +
	'<span class="calendar-loading-msg">' +
	'<img src="/images/loading.gif"/>' +
	'&nbsp;&nbsp;&nbsp;&nbsp;' +
	'</span>' +
	'<span class="calendar-channel-filters hide">' +
	(
		hideStaffAbsences ?
			''
			: '<button class="btn btn-default calendar-channel-toggle" data-target="staffAbsences"><i class="fa fa-fw fa-check-square-o"></i> Absences</button>' +
		'&nbsp;&nbsp;'
	) +
	'<button class="btn btn-default calendar-channel-toggle" data-target="genericEvents"><i class="fa fa-fw fa-check-square-o"></i> Events</button>' +
	'&nbsp;&nbsp;' +
	'<button class="btn btn-default calendar-channel-cameras"><i class="fa fa-fw fa-camera"></i> Camera Use</button>' +
	'</span>');

	// perform action for toggle buttons
	$('.calendar-channel-toggle').click(function (e) {
		e.preventDefault();

		// get target
		var target = $(this).data('target');

		// switch button classes
		if (calendarChannelOptions[target]) {
			$(this).find('i').removeClass('fa-check-square-o').addClass('fa-square-o');
		} else {
			$(this).find('i').removeClass('fa-square-o').addClass('fa-check-square-o');
		}

		// change option
		calendarChannelOptions[target] = !calendarChannelOptions[target];

		// redraw
		calendarEvents.length = 0;
		updateCalendar(
			currentOptions['selector'],
			currentOptions['startDate'],
			currentOptions['endDate'],
			currentOptions['options']
		);

		// drop focus
		$(this).blur();
	});

	// perform action for camera selection buttons
	$('.calendar-channel-cameras').click(function (e) {
		e.preventDefault();
		openCameraSelectModal();
	});

	return cal;
}

function updateCalendar(selector, startDate, endDate, options) {
	// store current options
	currentOptions['selector'] = selector;
	currentOptions['startDate'] = startDate;
	currentOptions['endDate'] = endDate;
	currentOptions['options'] = options;

	// show loading message
	setLoading(true, selector);

	// adjust end date backwards by one
	endDate = new Date(((endDate.getTime()) - 86400000));

	// get start/end strings to pass to calendar data route
	var startDateString = startDate.getFullYear()
		+ '-'
		+ (startDate.getMonth() < 10 ? '0' : '') + (startDate.getMonth() + 1)
		+ '-'
		+ ((startDate.getDate()) < 10 ? '0' : '') + (startDate.getDate());
	var endDateString = endDate.getFullYear()
		+ '-'
		+ (endDate.getMonth() < 10 ? '0' : '') + (endDate.getMonth() + 1)
		+ '-'
		+ ((endDate.getDate()) < 10 ? '0' : '') + (endDate.getDate());

	// build URL
	var url = '/ajax/calendar-data?start=' + startDateString + '&end=' + endDateString;
	for (var key in options) url += '&' + key + '=' + (options[key] === true ? '1' : options[key]);
	for (key in calendarChannelOptions) url += '&' + key + '=' + (calendarChannelOptions[key] === true ? '1' : calendarChannelOptions[key]);
	url += '&cameras=';
	if (selectedCameras == null) {
		// default to all
		url += 'all';
	} else {
		url += selectedCameras.join(',');
	}

	// send AJAX call
	$.get(url)
		.done(function (result) {
			var rawJson = result.toString();
			var parsedJson = JSON.parse(rawJson);

			// loop through bookings
			if (calendarChannelOptions['bookings'] && typeof(parsedJson.bookings) != "undefined") {
				var bookingTitle, bookingCameraType, bookingStart, bookingEnd;
				for (var i = 0; i < parsedJson.bookings.length; ++i) {
					for (var j = 0; j < parsedJson.bookings[i].bookingSections.length; ++j) {
						// build title
						bookingTitle = parsedJson.bookings[i].therapyName + ":\n" + parsedJson.bookings[i].patientName;

						// build camera type
						bookingCameraType = parsedJson.bookings[i].cameraName;

						// start and end time
						bookingStart = parsedJson.bookings[i].bookingSections[j].startTime + ":00";
						bookingStart = bookingStart.replace(" ", "T");
						bookingEnd = parsedJson.bookings[i].bookingSections[j].endTime + ":00";
						bookingEnd = bookingEnd.replace(" ", "T");

						// add event
						calendarEvents.push({
							title: bookingTitle,
							start: bookingStart,
							end: bookingEnd,
							msg: "" +
							"Start time: <strong>" + parsedJson.bookings[i].bookingSections[j].startTime.substring(10, 16) + "</strong>"
							+ "<br/>" +
							"End time: <strong>" + parsedJson.bookings[i].bookingSections[j].endTime.substring(10, 16) + "</strong>"
							+ "<br>" + bookingCameraType,
							allDay: false,
							url: '/booking-details/' + parsedJson.bookings[i].id,
							type: 'booking booking-' + parsedJson.bookings[i].colourNumber
						});
					}
				}
			}

			// loop through absences
			if (calendarChannelOptions['staffAbsences'] && typeof(parsedJson.staffAbsences) != "undefined") {
				var absenceTitle, absenceStart, absenceEnd;
				for (i = 0; i < parsedJson.staffAbsences.length; ++i) {
					// build title
					absenceTitle = "Absent: " + parsedJson.staffAbsences[i].staffName;

					// start and end time
					absenceStart = parsedJson.staffAbsences[i].from + ":00";
					absenceStart = absenceStart.replace(" ", "T");
					absenceEnd = parsedJson.staffAbsences[i].to + ":00";
					absenceEnd = absenceEnd.replace(" ", "T");

					// add event
					calendarEvents.push({
						title: absenceTitle,
						start: absenceStart,
						end: absenceEnd,
						msg: "" +
						"Start time: <strong>" + parsedJson.staffAbsences[i].from.substring(10, 16) + "</strong>" +
						"<br/>" +
						"End time: <strong>" + parsedJson.staffAbsences[i].to.substring(10, 16) + "</strong>",
						allDay: false,
						type: 'absence'
					});
				}
			}

			// loop through events
			if (calendarChannelOptions['genericEvents'] && typeof(parsedJson.genericEvents) != "undefined") {
				var eventTitle, eventDesc, eventStart, eventEnd;
				for (i = 0; i < parsedJson.genericEvents.length; ++i) {
					// build title and desc
					eventTitle = parsedJson.genericEvents[i].title;
					eventDesc = parsedJson.genericEvents[i].description;

					// start and end time
					eventStart = parsedJson.genericEvents[i].from + ":00";
					eventStart = eventStart.replace(" ", "T");
					eventEnd = parsedJson.genericEvents[i].to + ":00";
					eventEnd = eventEnd.replace(" ", "T");

					// add event
					calendarEvents.push({
						title: eventTitle,
						start: eventStart,
						end: eventEnd,
						msg: "" +
						"Start time: <strong>" + parsedJson.genericEvents[i].from.substring(10, 16) + "</strong>" +
						"<br/>" +
						"End time: <strong>" + parsedJson.genericEvents[i].to.substring(10, 16) + "</strong>" +
						"<br />" + eventDesc,
						allDay: false,
						type: 'generic-event'
					});
				}
			}

			// update events
			selector.fullCalendar('refetchEvents');

			// hide loading message
			setLoading(false, selector);
		})
		.fail(function (xhr, textStatus, errorThrown) {
			toastr.error("Failed to load calendar data.");
			$('.calendar-loading-msg').hide();
		}
	);
}

function openCameraSelectModal() {
	var modal = $('.camera-select-modal');

	modal.removeClass('hide').modal({
		backdrop: 'static',
		keyboard: false
	});

	modal.find("input:checkbox").each(function (i, e) {
		if (selectedCameras == null) {
			$(e).prop('checked', true);
			return;
		}
		var id = $(e).attr('id');
		for (i in selectedCameras) {
			if (id == "camera-" + selectedCameras[i]) {
				$(e).prop('checked', true);
				return;
			}
		}
		$(e).prop('checked', false);
	});

	$('.btn-update').unbind('click').click(function (e) {
		// get selected
		selectedCameras = $('.selected-cameras:checked').map(function () {
			return this.value;
		}).get();

		// redraw
		calendarEvents.length = 0;
		updateCalendar(
			currentOptions['selector'],
			currentOptions['startDate'],
			currentOptions['endDate'],
			currentOptions['options']
		);

		// close modal
		modal.modal('hide');
	});

	$('.btn-cancel').unbind('click').click(function (e) {
		modal.modal('hide');
	});
}

function setLoading(loading, calendar) {
	if (loading) {
		$('.calendar-loading-msg').show();
		$('.calendar-channel-filters').find('button').prop('disabled', true);
		calendar.fadeTo(300, 0.4);
	} else {
		$('.calendar-loading-msg').hide();
		$('.calendar-channel-filters').removeClass('hide').show();
		$('.calendar-channel-filters').find('button').prop('disabled', false);
		calendar.fadeTo(300, 1.0);
	}
}
