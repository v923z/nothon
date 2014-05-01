function calendar_path(date) {
	var month = (100 + date.getMonth() + 1).toString().slice(1,3)
	var day = (100 + date.getDate()).toString().slice(1,3)
	return 'Calendar/' + date.getFullYear() + '/' + month + '/' + day
}
