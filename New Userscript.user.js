// ==UserScript==
// @name         Renweb
// @namespace    http://digitaleagle.net/
// @version      0.1
// @description  Creating a system to reconcile the homework and grades
// @author       You
// @match        https://accounts.renweb.com/*
// @match        https://familyportal.renweb.com/*
// @match        https://gce-fl.client.renweb.com/*
// @require https://code.jquery.com/jquery-3.7.1.min.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=renweb.com
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    var menuUpdating = false;
    var currentReport = "";
    var data = createDataObject();
    var currentStudent;

    // Document ready
    $(document).ready(function() {
        console.log("SKP Document loaded: ", window.location.href, $('.pwr_middle_content .lessonplans').length);
        // Fill out the login
        if($('#rw-password').length > 0) {
            $('#rw-password').after("<button id='skp-password-save'>Save Password</button>");
            $('#skp-password-save').click(function() {
                GM_setValue("renweb-password", $('#rw-password').val());
                return false;
            });
            var password = GM_getValue("renweb-password");
            if(password !== undefined) {
                $('#rw-password').val(password);
            }
        }

        setTimeout(function() {
            /* This was from when I was relying on a dynamic portion of the menu
            $('mat-sidenav').on('DOMSubtreeModified', updateMenu);  */
            updateMenu();
        }, 500);

        $('.pwr_middle_content').on('DOMSubtreeModified', loadPwrTab);
        currentReport = $('h3.grades_title').text();
        if($('.pwr_middle_content .lessonplans').length > 0) {
            loadPwrTab();
        }
    });

    function createDataObject() {
        var dataText = GM_getValue("renweb-saved-data");
        var data;
        if(dataText === undefined) {
            data = {};
        } else {
            data = JSON.parse(dataText);
        }

        if(data.students === undefined) {
            data.students = [];
        }

        return data;
    }
    function addOrGetClass(id, name) {
        var foundClass = undefined;
        $.each(currentStudent.classes, function(index, classObj) {
            if((classObj.id === undefined && classObj.name == name) || (id !== undefined && classObj.id == id)) {
                foundClass = classObj;
            }
        });
        if(foundClass === undefined) {
            foundClass = {};
            if(id !== undefined) {
                foundClass.id = id;
            }
            foundClass.name = name;
            currentStudent.classes.push(foundClass);
        }
        if(foundClass.homework === undefined) {
            foundClass.homework = [];
        }
        if(foundClass.grades === undefined) {
            foundClass.grades = [];
        }
        return foundClass;
    }

    function updateMenu() {
        console.log("Nav Changed!", $('#nav_logo_container ul:first').length);
        if($('.skp-menu-item').length > 0) {
            console.log("Already updated");
            return;
        }
        /*   This was before when I was relying on part that was dynamically loading...
        if($('#nav_logo_container ul:first').length == 0) {
            console.log("Menu not loaded yet");
            return;
        } */
        if(menuUpdating) {
            console.log("Menu currently updating, bailing!");
            return;
        }
        menuUpdating = true;
        console.log("Updating the menu!");
        // $('#nav_logo_container ul:first').append('<li class="ng-star-inserted skp-menu-item"><a><i class="material-icons pwr_header-icon">summarize</i>Stephen\'s Report</a></li>');
        $('mat-sidenav ul:first').append('<li class="ng-star-inserted skp-menu-item"><a><i class="material-icons pwr_header-icon">summarize</i>Stephen\'s Report</a></li>');
        $('.skp-menu-item a').click(buildReport);
        menuUpdating = false;
    }

    /* -----------------------------------------------------------------------------------------------------------------------
        Build the report
       ----------------------------------------------------------------------------------------------------------------------- */
    function buildReport() {
        // reload the data --- it may have been updated/loaded in an iFrame
        data = createDataObject();


        console.log("Build the report", data);
        console.log($('app-iframe iframe')[0]);
        // console.log($('app-iframe iframe')[0].contentWindow.location.href);
        //$('app-iframe iframe')[0].contentWindow.location.replace("https://gce-fl.client.renweb.com/pwr/student/homework.cfm");
        $('mat-sidenav-content iframe')[0].contentWindow.location.replace("about:blank");
        console.log($("app-iframe").parent()[0]);
        $("#skp-report").remove();
        $("mat-sidenav-content iframe").before("<div id='skp-report'><h1>Agenda Report</h1></div>");
        $("#skp-report").css("margin", "10px");

        // Buttons at the top
        // ----------------------------------------
        $("#skp-report").append("<div id='skp-report-buttons'><button id='skp-close-button'>Close</button></div>");
        $('#skp-close-button').click(function() {
            $("#skp-report").remove();
        });
        $("#skp-report-buttons").append("<button id='skp-print-button'>Print</button>");
        $('#skp-print-button').click(function() {
            // var mywindow = window.open('', 'PRINT', 'height=800,width=1200');
            var mywindow = window.open('', 'PRINT', '');

            var printContent = $("<div>" + $("#skp-report").html() + "</div>");
            console.log("before Print content", printContent, printContent.html(), printContent.find("#skp-report-buttons").length);
            printContent.find("#skp-report-buttons").remove();
            printContent.find("button").remove();
            console.log("after Print content", printContent, printContent.html());

            mywindow.document.write('<html><head><title>' + document.title  + '</title>');
            mywindow.document.write('</head><body >');
            // mywindow.document.write($("#skp-report").html());
            mywindow.document.write(printContent.html());
            mywindow.document.write('</body></html>');

            mywindow.document.close(); // necessary for IE >= 10
            setTimeout(function() {
                mywindow.focus(); // necessary for IE >= 10*/

                mywindow.print();
            }, 500);
        });
        $("#skp-report-buttons").append("<button id='skp-delete-button'>Delete All Data</button>");
        $('#skp-delete-button').click(function() {
            $('#skp-report-buttons').after("<div id='skp-are-you-sure'>Are you sure you want to delete all your data?  You can't undo!!!</div>");
            $('#skp-are-you-sure').append("<div><button>Yes, I'm sure</button></div>");
            $('#skp-are-you-sure button').click(function() {
                data = {};
                GM_setValue("renweb-saved-data", JSON.stringify(data));
                buildReport();
            });
        });
        if(data.showAll) {
            $("#skp-report-buttons").append("<button id='skp-showall-button'>Don't Show All Data</button>");
            $('#skp-showall-button').click(function() {
                data.showAll = false;
                GM_setValue("renweb-saved-data", JSON.stringify(data));
                buildReport();
            });
        } else {
            $("#skp-report-buttons").append("<button id='skp-showall-button'>Show All Data</button>");
            $('#skp-showall-button').click(function() {
                data.showAll = true;
                GM_setValue("renweb-saved-data", JSON.stringify(data));
                buildReport();
            });
        }
        $("#skp-report-buttons").append("<button id='skp-backup-button'>Backup</button>");
        $('#skp-backup-button').click(function() {
            $("#skp-report-buttons").after("<div id='skp-backup-area'><textarea></textarea></div>");
            $("#skp-backup-area textarea").val(JSON.stringify(data));
            $("#skp-backup-area textarea").css("width", "100%");
            $("#skp-backup-area textarea").css("height", "200px");
        });
        $("#skp-report-buttons").append("<button id='skp-restore-button'>Restore</button>");
        $('#skp-restore-button').click(function() {
            $("#skp-report-buttons").after("<div id='skp-backup-area'><textarea></textarea></div>");
            $("#skp-backup-area textarea").css("width", "100%");
            $("#skp-backup-area textarea").css("height", "200px");
            $("#skp-backup-area").append("<button id='skp-do-restore-button'>Restore</button>");
            $('#skp-do-restore-button').click(function() {
                $('#skp-do-restore-button').remove();
                $('#skp-backup-area').append("<div>Are you sure? This will delete everything.  Maybe backup first?</div><button id='skp-restore-anyway-button'>Yes, restore anyway</button>");
                $('#skp-restore-anyway-button').click(function() {
                    GM_setValue("renweb-saved-data", $('#skp-backup-area textarea').val());
                    buildReport();
                });
            });
        });
        $("#skp-report-buttons").append("<a target='_blank' href='https://github.com/digitaleagle/RenwebTampermonkey'>Github</a>");
        $("#skp-report-buttons button").css('margin-right', '15px');

        // each student
        // ----------------------------------------
        $.each(data.students, function(studentIndex, student) {
            console.log("Building student", student.name, student);
            if(student.hidden && !data.showAll) {
                return true;
            }
            // build the lists of stuff
            // ----------------------------------------
            var pendingHomework = [];
            var turnedInHomework = [];
            var gradedHomework = [];
            var poorGrades = [];
            $.each(student.classes, function(classIndex, classObj) {
                //console.log("Building class", classObj.name, classObj);
                $.each(classObj.homework, function(homeworkIndex, homework) {
                    //console.log("Building homework", homework);
                    $.each(homework.items, function(homeworkItemIndex, homeworkItem) {
                        //console.log("Building Homework item", homeworkItem);
                        if(!homeworkItem.isNoHomework && !homeworkItem.isSameAs) {
                            if(homeworkItem.isTurnedIn) {
                                if(homeworkItem.gradeId === undefined || homeworkItem.gradeId === null || homeworkItem.gradeId.trim() == "") {
                                    turnedInHomework.push({
                                        "class": classObj,
                                        "className": classObj.name,
                                        "date": homeworkItem.date,
                                        "sortable": homework.date.sortable,
                                        "homeworkItem": homeworkItem,
                                        "homework": homework,
                                        "name": homeworkItem.text,
                                        "studentIndex": studentIndex,
                                        "classIndex": classIndex,
                                        "homeworkIndex": homeworkIndex,
                                        "homeworkItemIndex": homeworkItemIndex
                                    });
                                } else {
                                    gradedHomework.push({
                                        "class": classObj,
                                        "className": classObj.name,
                                        "date": homeworkItem.date,
                                        "sortable": homework.date.sortable,
                                        "homeworkItem": homeworkItem,
                                        "homework": homework,
                                        "name": homeworkItem.text,
                                        "studentIndex": studentIndex,
                                        "classIndex": classIndex,
                                        "homeworkIndex": homeworkIndex,
                                        "homeworkItemIndex": homeworkItemIndex
                                    });
                                }
                            } else {
                                var actualDueDate = homeworkItem.actualDueDate;
                                if(actualDueDate === undefined || actualDueDate === null || actualDueDate == "") {
                                    actualDueDate = homeworkItem.date;
                                }
                                pendingHomework.push({
                                    "class": classObj,
                                    "className": classObj.name,
                                    //"date": homeworkItem.date,
                                    "date": actualDueDate,
                                    //"sortable": homework.date.sortable,
                                    "sortable": actualDueDate,
                                    "homeworkItem": homeworkItem,
                                    "homework": homework,
                                    "name": homeworkItem.text,
                                    "studentIndex": studentIndex,
                                    "classIndex": classIndex,
                                    "homeworkIndex": homeworkIndex,
                                    "homeworkItemIndex": homeworkItemIndex
                                });
                            }
                        }
                    });
                });
                $.each(classObj.grades, function(gradeIndex, grade) {
                    var average = grade.grade;
                    average = parseInt(average.replace("Avg:", ""));
                    if(average < 80) {
                        poorGrades.push({
                            "gradeObj": grade,
                            "grade": average,
                            "descr": grade.title,
                            "class": classObj,
                            "className": classObj.name
                        });
                    }
                });
            });
            pendingHomework.sort(function (a, b) {
                var aDate = a.sortable;
                var bDate = b.sortable;

                if(aDate < bDate) return -1;
                if(aDate > bDate) return 1;
                return 0;
            });
            turnedInHomework.sort(function (a, b) {
                var aDate = a.dateTurnedIn;
                var bDate = b.dateTurnedIn;

                if(aDate < bDate) return 1;
                if(aDate > bDate) return -1;
                return 0;
            });
            console.log("Lists built", "data", data, "Pending Homework", pendingHomework, "Turned In", turnedInHomework, "Graded", gradedHomework, "Poor Grades", poorGrades);

            $("#skp-report").append("<h2></h2>");
            $("#skp-report h2:last").text(student.name);
            $("#skp-report h2:last").append("&nbsp;&nbsp;&nbsp;<button>Hide</button>");
            if(student.hidden) {
                $("#skp-report h2:last button").text("unhide");
            }
            $("#skp-report h2:last button").click(function() {
                if(student.hidden) {
                    student.hidden = false;
                } else {
                    student.hidden = true;
                }
                // note: have to save because the build report reload the data
                GM_setValue("renweb-saved-data", JSON.stringify(data));
                buildReport();
            });
            $("#skp-report").append("<h3>Pending Homework</h3>");
            // Add button to add in homework
            $("#skp-report h3:last").append("&nbsp;&nbsp;&nbsp;<button id='skp-add-hw'>Add Homework</button>");
            $("#skp-add-hw").click(function() {
                $("#skp-add-hw").parent().after("<div id='skp-add-hw-section'></div>");
                $("#skp-add-hw-section").append("<input type='text' id='skp-hw-name'>");
                $("#skp-add-hw-section").append("<br><select id='skp-hw-class'>");
                $("#skp-add-hw").remove();
                $.each(student.classes, function(index, cls) {
                    $("#skp-hw-class").append("<option></option>");
                    $("#skp-hw-class option:last").attr("value", index);
                    $("#skp-hw-class option:last").text(cls.name);
                });
                $("#skp-add-hw-section").append("<br><button>Add</button>");
                $("#skp-add-hw-section button").click(function() {
                    var classIndex = parseInt($("#skp-hw-class").val());
                    var classObj = student.classes[classIndex];
                    var homeworkDate = new Date();
                    var newText = $("#skp-hw-name").val();
                    console.log("Add Homework", student, classIndex, classObj, newText);
                    classObj.homework[classObj.homework.length] = {
                        "date": {
                            "text": (homeworkDate.getMonth() + 1) + "/" + homeworkDate.getDate() + "/" + homeworkDate.getFullYear(),
                            "date": homeworkDate + "",
                            "sortable": dateToString(homeworkDate)
                        },
                        "items": [
                            {
                                "date": dateToString(homeworkDate),
                                "dateComplete": "",
                                "dateTurnedIn": "",
                                "gradeId": null,
                                "isComplete": false,
                                "isNoHomework": false,
                                "isTurnedIn": false,
                                "notes": "",
                                "text": newText
                            }
                        ],
                        "text": newText
                    }
                    console.log("Homework added ...", classObj.homework);
                    GM_setValue("renweb-saved-data", JSON.stringify(data));
                    buildReport();
                });
            });
            $("#skp-report").append("<div class='skp-column-headings'></div>");
            $("#skp-report .skp-column-headings:last").append("<div>Complete</div>");
            $("#skp-report .skp-column-headings:last").append("<div>Turned In</div>");
            $("#skp-report .skp-column-headings:last").append("<div>Homework</div>");
            $("#skp-report .skp-column-headings:last div").css("font-weight", "bold");
            $("#skp-report .skp-column-headings:last div:eq(0)").css("width", "100px");
            $("#skp-report .skp-column-headings:last div:eq(1)").css("width", "100px");
            $("#skp-report .skp-column-headings:last div").css("display", "inline-block");
            $.each(pendingHomework, function(index, item) {
                $("#skp-report").append("<div class='skp-homework'></div>");
                $("#skp-report .skp-homework:last").css("margin-top", "10px");
                $("#skp-report .skp-homework:last").css("cursor", "pointer");
                $("#skp-report .skp-homework:last").text(item.date + " -- " + item.className + ": " + item.name);
                $("#skp-report .skp-homework:last").attr('studentIndex', item.studentIndex);
                $("#skp-report .skp-homework:last").attr('classIndex', item.classIndex);
                $("#skp-report .skp-homework:last").attr('homeworkIndex', item.homeworkIndex);
                $("#skp-report .skp-homework:last").attr('homeworkItemIndex', item.homeworkItemIndex);
                $("#skp-report .skp-homework:last").prepend('<div>&nbsp</div>');
                $("#skp-report .skp-homework:last").prepend('<div>&nbsp</div>');
                $("#skp-report .skp-homework:last div").css('display', 'inline-block');
                $("#skp-report .skp-homework:last div").css('height', '30px');
                $("#skp-report .skp-homework:last div").css('width', '30px');
                $("#skp-report .skp-homework:last div").css('border', 'solid 1px black');
                $("#skp-report .skp-homework:last div").css('margin-left', '35px');
                $("#skp-report .skp-homework:last div").css('margin-right', '35px');
                $("#skp-report .skp-homework:last div").css('font-size', '25px');
                if(item.homeworkItem.isComplete) {
                    $("#skp-report .skp-homework:last div:eq(0)").text("x");
                }
                if(item.homeworkItem.isTurnedIn) {
                    $("#skp-report .skp-homework:last div:eq(1)").text("x");
                }
            });
            $("#skp-report").append("<h3>Turned In Homework</h3>");
            $.each(turnedInHomework, function(index, item) {
                $("#skp-report").append("<div class='skp-homework'></div>");
                $("#skp-report .skp-homework:last").css("margin-top", "10px");
                $("#skp-report .skp-homework:last").css("cursor", "pointer");
                $("#skp-report .skp-homework:last").text(item.homeworkItem.dateTurnedIn + " -- " + item.className + ": " + item.name);
                $("#skp-report .skp-homework:last").attr('studentIndex', item.studentIndex);
                $("#skp-report .skp-homework:last").attr('classIndex', item.classIndex);
                $("#skp-report .skp-homework:last").attr('homeworkIndex', item.homeworkIndex);
                $("#skp-report .skp-homework:last").attr('homeworkItemIndex', item.homeworkItemIndex);
            });
            $("#skp-report .skp-homework").click(HomeworkClicked);
            $("#skp-report").append("<h3>Poor Grades</h3>");
            $.each(poorGrades, function(index, item) {
                $("#skp-report").append("<div class='skp-grade'></div>");
                $("#skp-report .skp-grade:last").css("margin-top", "10px");
                $("#skp-report .skp-grade:last").css("cursor", "pointer");
                $("#skp-report .skp-grade:last").text(item.className + " -- " + item.descr + ": " + item.grade);
            });
        });
    }

    /* -----------------------------------------------------------------------------------------------------------------------
        Build the homework item UI
       ----------------------------------------------------------------------------------------------------------------------- */
    function HomeworkClicked() {
        var studentIndex = parseInt($(this).attr("studentIndex"));
        var student = data.students[studentIndex];
        var classIndex = parseInt($(this).attr("classIndex"));
        var classObj = student.classes[classIndex];
        var homeworkIndex = parseInt($(this).attr("homeworkIndex"));
        var homework = classObj.homework[homeworkIndex];
        var homeworkItemIndex = parseInt($(this).attr("homeworkItemIndex"));
        var item = homework.items[homeworkItemIndex];
        console.log("Homemwork clicked", this, "Student: ", student, "Class: ", classObj, "Homework:", homework, "Homework Item:", item);

        $(".skp-homework-edit").remove();
        $(this).after("<div class='skp-homework-edit'><hr><hr></div>");
        $(".skp-homework-edit").attr('studentIndex', studentIndex);
        $(".skp-homework-edit").attr('classIndex', classIndex);
        $(".skp-homework-edit").attr('homeworkIndex', homeworkIndex);
        $(".skp-homework-edit").attr('homeworkItemIndex', homeworkItemIndex);
        $(".skp-homework-edit hr:last").before("<div>Class: <span></span></div>");
        $(".skp-homework-edit div:last span").text(classObj.name);
        $(".skp-homework-edit hr:last").before("<div>Homework: <span></span></div>");
        $(".skp-homework-edit div:last span").text(item.text);
        $(".skp-homework-edit hr:last").before("<div>Homework Date: <span></span></div>");
        $(".skp-homework-edit div:last span").text(item.date);
        $(".skp-homework-edit hr:last").before("<div><input class='skp-is-complete' type='checkbox'>Is Complete?&nbsp;&nbsp;<input type='date' class='skp-complete-date'></div>");
        if(item.isComplete) {
            $(".skp-homework-edit input.skp-is-complete").prop("checked", true);
        }
        $(".skp-homework-edit input.skp-complete-date").val(item.dateComplete);
        $(".skp-homework-edit hr:last").before("<div><input class='skp-is-turned-in' type='checkbox'>Is Turned in?&nbsp;&nbsp;<input type='date' class='skp-turn-in-date'></div>");
        if(item.isTurnedIn) {
            $(".skp-homework-edit input.skp-is-turned-in").prop("checked", true);
        }
        $(".skp-homework-edit input.skp-turn-in-date").val(item.dateTurnedIn);
        $(".skp-homework-edit hr:last").before("<div><select id='skp-grade-select'><option value=' '>Not graded</option></select>");
        $.each(classObj.grades, function(index, grade) {
            $(".skp-homework-edit select").append("<option></option>");
            $(".skp-homework-edit select option:last").text(grade.title);
            $(".skp-homework-edit select option:last").attr("value", grade.id);
        });
        $(".skp-homework-edit select").val(item.gradeId);
        $(".skp-homework-edit hr:last").before("<div>Actual due date (if different)&nbsp;&nbsp;<input type='date' class='skp-actual-due-date'></div>");
        $(".skp-homework-edit hr:last").before("<div>Notes<textarea></textarea>");
        if(item.notes !== undefined && item.notes !== null) {
            $(".skp-homework-edit textarea").val(item.notes);
        }
        $(".skp-homework-edit hr:last").before("<div><input class='skp-is-no-homework' type='checkbox'>Is No Homework?&nbsp;&nbsp;</div>");
        if(item.isNoHomework) {
            $(".skp-homework-edit input.skp-is-no-homework").prop("checked", true);
        }
        $(".skp-homework-edit hr:last").before("<div><select id='skp-sameas-select'><option value=' '>Not same as any assignment</option></select>");
        $.each(classObj.homework, function(i1, homework) {
            $.each(homework.items, function(i2, item) {
                if(item.isNoHomework && item.isSameAs) {
                    // don't add if it is not homework
                    return true;
                }
                $(".skp-homework-edit select:last").append("<option></option>");
                $(".skp-homework-edit select:last option:last").text(homework.date.sortable + ": " + item.text);
                $(".skp-homework-edit select:last option:last").attr("value", homework.date.sortable + ":" + i2);
            });
        });
        $(".skp-homework-edit select:last").css('width', '300px');
        $(".skp-homework-edit select").css('max-width', '100%');
        if(item.isSameAs) {
            $(".skp-homework-edit select:last").val(item.sameAs);
        }
        $(".skp-homework-edit hr:last").before("<button>Save</button>");
        $(".skp-homework-edit button").click(saveHomework);
    };

    /* -----------------------------------------------------------------------------------------------------------------------
        Save Homework Updates
       ----------------------------------------------------------------------------------------------------------------------- */
    function saveHomework() {
        var studentIndex = parseInt($(".skp-homework-edit").attr("studentIndex"));
        var student = data.students[studentIndex];
        var classIndex = parseInt($(".skp-homework-edit").attr("classIndex"));
        var classObj = student.classes[classIndex];
        var homeworkIndex = parseInt($(".skp-homework-edit").attr("homeworkIndex"));
        var homework = classObj.homework[homeworkIndex];
        var homeworkItemIndex = parseInt($(".skp-homework-edit").attr("homeworkItemIndex"));
        var item = homework.items[homeworkItemIndex];

        item.isComplete = $(".skp-homework-edit input.skp-is-complete").is(":checked");
        item.isTurnedIn = $(".skp-homework-edit input.skp-is-turned-in").is(":checked");
        item.dateComplete = $(".skp-homework-edit input.skp-complete-date").val();
        item.dateTurnedIn = $(".skp-homework-edit input.skp-turn-in-date").val();
        item.gradeId = $("#skp-grade-select").val();
        item.notes = $(".skp-homework-edit textarea").val();
        item.isNoHomework = $(".skp-homework-edit input.skp-is-no-homework").is(":checked");
        item.actualDueDate = $(".skp-homework-edit input.skp-actual-due-date").val();
        var sameAs = $('#skp-sameas-select').val();
        if(sameAs.trim() == "") {
            item.isSameAs = false;
        } else {
            item.isSameAs = true;
            var splits = sameAs.split(":");
            item.sameAsDate = splits[0];
            item.sameAsIndex = parseInt(splits[1]);
            item.sameAs = sameAs;
        }
        console.log("Homework saved", this, student, classObj, homework, item, data);
        GM_setValue("renweb-saved-data", JSON.stringify(data));
        buildReport();
    }

    function loadStudents() {
        $('select[name="studentid"] option').each(function (index, element) {
            console.log($(element).attr("value"), $(element).text(), $(element).attr("selected"));
            var studentId = $(element).attr("value");
            var studentName = $(element).text();
            var studentSelected = $(element).attr("selected") == "selected";
            var exists = false;
            $.each(data.students, function(index, student) {
                if(student.id == studentId) {
                    exists = true;
                    student.name = studentName;
                    student.selected = studentSelected;
                    if(student.selected) {
                        currentStudent = student;
                    }
                }
            });
            if(!exists) {
                var student = {};
                student.id = studentId;
                student.name = studentName;
                student.selected = studentSelected;
                student.classes = [];
                data.students.push(student);
                if(student.selected) {
                    currentStudent = student;
                }
            }
        });
        console.log("Data from loadstudents", data);
    }

    function loadPwrTab() {
        currentReport = $('h3.grades_title').text();
        console.log("Current Report", currentReport);
        if($('select[name="studentid"]').length > 0) {
            loadStudents();
        }
        if(currentReport == 'Gradebook Student Progress Report') {
            var currentClass = {};
            var className = $("div.course_title").text();
            var currentClass = addOrGetClass(undefined, className);
            //if(currentClass.gradeSections == undefined) {
                currentClass.gradeSections = [];
            //}
            if(currentClass.grades == undefined) {
                currentClass.grades = [];
            }
            console.log($("div.course_title").text());
            $('div.grades_head.btop.bbottom').each(function(sectionIndex,element) {
                var section = {};
                currentClass.gradeSections[currentClass.gradeSections.length] = section;
                section.title = $(element).find(".grades_left").text();
                section.grades = [];
                console.log("Grade Header", $(element)[0], $(element).next());
                $(element).next().find("tbody tr").each(function(index,element) {
                    var grade = {};
                    section.grades.push(grade);
                    grade.index = "s" + sectionIndex + "g" + index;
                    grade.sectionIndex = sectionIndex;
                    grade.gradeIndex = index;
                    grade.id = grade.index;
                    grade.title = $(element).find("td:eq(0)").text();
                    grade.grade = $(element).find("td:eq(3)").text();
                    grade.due = $(element).find("td:eq(5)").text();
                    console.log($(element).find("td:eq(0)").text());
                    var found = false;
                    $.each(currentClass.grades, function(index, g) {
                        if(grade.id == g.id) {
                            found = true;
                            g.title = grade.title;
                            g.due = grade.due;
                            g.grade = grade.grade;
                        }
                    });
                    if(!found) {
                        currentClass.grades.push(grade);
                    }
                });
            });
            console.log("Current class", currentClass);
        } else {
            if($('.pwr_middle_content .lessonplans').length > 0) {
                currentReport = "Homework";
                var currentDate;

                $('div.pwr_date_hr,section.lessonplans').each(function(index,element) {
                    if($(element).hasClass('pwr_date_hr')) {
                        currentDate = {"text": $(element).find(".pwr_date").text()};
                        currentDate.date = parseDate(currentDate.text);
                        currentDate.sortable = dateToString(currentDate.date);
                        // console.log("Date: ", currentDate, element);
                    } else {
                        var className = $(element).find('h3').text();
                        var classObj = addOrGetClass(undefined, className);
                        var homework = {};
                        var found = false;
                        $.each(classObj.homework, function(index, item) {
                            if(item.date.text == currentDate.text) {
                                homework = item;
                                found = true;
                            }
                        });
                        if(!found) {
                            homework.date = currentDate;
                        }
                        if(found && homework.text == $(element).find(".content_wrapper p").text()) {
                           // no need to parse
                        } else {
                            homework.text = $(element).find(".content_wrapper p").text();
                            if(homework.items === undefined) {
                                homework.items = [];
                            }
                            var isAllNoHomework = true;
                            $(element).find(".content_wrapper p").each(function(index, p) {
                                var itemText = $(p).text();
                                var isNoHomework = false;
                                if(itemText.toLowerCase() == "no homework" || itemText.toLowerCase() == "no hw") {
                                    isNoHomework = true;
                                }
                                if(itemText.toLowerCase().startsWith("no school")) {
                                    isNoHomework = true;
                                }
                                homework.items.push({
                                    "date": currentDate.sortable,
                                    "text": itemText,
                                    "isNoHomework": isNoHomework
                                });
                                if(!isNoHomework) {
                                    isAllNoHomework = false;
                                }
                            });
                            if(!isAllNoHomework) {
                                classObj.homework.push(homework);
                            }
                        }
                        // console.log("Class: ", className, classObj, homework, element);
                    }
                });
            }
        }
        console.log("data", data);
        GM_setValue("renweb-saved-data", JSON.stringify(data));
    }

    /* -----------------------------------------------------------------------------------------------------------------------
       -----------------------------------------------------------------------------------------------------------------------
       Utility Functions
       -----------------------------------------------------------------------------------------------------------------------
       ----------------------------------------------------------------------------------------------------------------------- */
    function dateToString(sourceDate) {
        var year = sourceDate.getFullYear();
        var month = sourceDate.getMonth() + 1;
        var day = sourceDate.getDate();
        if(month < 10) {
            month = "0" + month;
        } else {
            month = "" + month;
        }
        if(day < 10) {
            day = "0" + day;
        } else {
            day = "" + day;
        }
        return year + "-" + month + "-" + day;
    }
    function parseDate(sourceString) {
        var parts = sourceString.split("-");
        var year = 0;
        var month = 0;
        var day = 0;
        if(parts.length > 2) {
            year = parseInt(parts[0]);
            month = parseInt(parts[1]);
            day = parseInt(parts[2]);
        }
        parts = sourceString.split("/");
        if(parts.length > 2) {
            month = parseInt(parts[0]);
            day = parseInt(parts[1]);
            year = parseInt(parts[2]);
        }
        return new Date(year, month -1, day);
    }

    //  https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
})();
