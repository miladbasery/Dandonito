import React, { useState, useRef, useEffect } from "react";
import { FaCalendarAlt, FaTimes } from "react-icons/fa";
import "./JalaliDatePicker.css";

const toFaDigit = (text) => {
  if (text === null || text === undefined) return '';
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return text.toString().replace(/\d/g, (x) => farsiDigits[x]);
};

const JalaliDatePicker = ({
  value = "",
  onChange,
  placeholder = "انتخاب تاریخ",
  className = "",
  disabled = false,
  minDate = null,
  maxDate = null,
  showTodayButton = true,
  showClearButton = true,
  outputFormat = "jalali",
  inline = false, 
}) => {
  const [isOpen, setIsOpen] = useState(inline);
  const [selectedDate, setSelectedDate] = useState(value);
  const [currentJalali, setCurrentJalali] = useState(getCurrentJalaliDate());
  const [viewMode, setViewMode] = useState("calendar");
  const calendarRef = useRef(null);

  function gregorianToJalali(gy, gm, gd) {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = gy - 621;
    let gy2 = gm > 2 ? gy + 1 : gy;
    let days = 355666 + 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
    jy = -1595 + 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
    let jm, jd;
    if (days < 186) { jm = 1 + Math.floor(days / 31); jd = 1 + (days % 31); } 
    else { jm = 7 + Math.floor((days - 186) / 30); jd = 1 + ((days - 186) % 30); }
    return [jy, jm, jd];
  }

  function jalaliToGregorian(jy, jm, jd) {
    jy += 1595;
    let days = -355668 + 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4) + jd + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
    let gy = 400 * Math.floor(days / 146097);
    days %= 146097;
    if (days > 36524) { gy += 100 * Math.floor(--days / 36524); days %= 36524; if (days >= 365) days++; }
    gy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) { gy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
    let gd = days + 1;
    const sal_a = [ 0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
    let gm;
    for (gm = 0; gm < 13; gm++) { let v = sal_a[gm]; if (gd <= v) break; gd -= v; }
    return [gy, gm, gd];
  }

  function getCurrentJalaliDate() {
    const now = new Date();
    return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }

  const formatDate = (year, month, day) => `${year}/${month.toString().padStart(2, "0")}/${day.toString().padStart(2, "0")}`;

  const parseDate = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split("/");
    if (parts.length !== 3) return null;
    return { year: parseInt(parts[0]), month: parseInt(parts[1]), day: parseInt(parts[2]) };
  };

  const getDaysInJalaliMonth = (year, month) => {
    if (month <= 6) return 31;
    if (month <= 11) return 30;
    const leapYears = [1, 5, 9, 13, 17, 22, 26, 30];
    return leapYears.includes(year % 33) ? 30 : 29;
  };

  const getJalaliDayOfWeek = (year, month, day) => {
    const gregorianDate = jalaliToGregorian(year, month, day);
    const date = new Date(gregorianDate[0], gregorianDate[1] - 1, gregorianDate[2]);
    return (date.getDay() + 1) % 7;
  };

  const isDateInRange = (year, month, day) => {
    if (!minDate && !maxDate) return true;
    if (minDate) {
      const minDateObj = parseDate(minDate);
      if (minDateObj) {
        if (year < minDateObj.year) return false;
        if (year === minDateObj.year && month < minDateObj.month) return false;
        if (year === minDateObj.year && month === minDateObj.month && day < minDateObj.day) return false;
      }
    }
    if (maxDate) {
      const maxDateObj = parseDate(maxDate);
      if (maxDateObj) {
        if (year > maxDateObj.year) return false;
        if (year === maxDateObj.year && month > maxDateObj.month) return false;
        if (year === maxDateObj.year && month === maxDateObj.month && day > maxDateObj.day) return false;
      }
    }
    return true;
  };

  const generateDays = () => {
    const [year, month] = currentJalali;
    const daysInMonth = getDaysInJalaliMonth(year, month);
    const firstDayOfWeek = getJalaliDayOfWeek(year, month, 1);
    const days = [];
    const persianDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

    days.push(...persianDays.map((day) => ({ type: "header", label: day })));
    for (let i = 0; i < firstDayOfWeek; i++) days.push({ type: "empty" });

    const currentJalaliToday = getCurrentJalaliDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = formatDate(year, month, day);
      days.push({
        type: "day",
        day,
        date: dateString,
        isSelected: selectedDate === dateString,
        isToday: year === currentJalaliToday[0] && month === currentJalaliToday[1] && day === currentJalaliToday[2],
        is31DayMonth: month <= 6,
        isDisabled: !isDateInRange(year, month, day),
      });
    }
    return days;
  };

  const generateYears = () => {
    const currentYear = getCurrentJalaliDate()[0];
    return Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
  };

  useEffect(() => {
    if (inline) return; 
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsOpen(false);
        setViewMode("calendar");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inline]);

  const handleDateSelect = (date) => {
    let outputDate = date;
    if (outputFormat === "gregorian") {
      const parts = date.split("/");
      if (parts.length === 3) {
        const gregorian = jalaliToGregorian(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
        outputDate = `${gregorian[0]}-${gregorian[1].toString().padStart(2, "0")}-${gregorian[2].toString().padStart(2, "0")}`;
      }
    }
    setSelectedDate(date);
    onChange && onChange(outputDate);
    if (!inline) setIsOpen(false);
    setViewMode("calendar");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedDate("");
    onChange && onChange("");
  };

  const handleYearSelect = (year) => { setCurrentJalali([year, currentJalali[1], currentJalali[2]]); setViewMode("calendar"); };
  const handleMonthSelect = (month) => { setCurrentJalali([currentJalali[0], month, currentJalali[2]]); setViewMode("calendar"); };

  const changeMonth = (increment) => {
    let [y, m, d] = currentJalali;
    m += increment;
    if (m > 12) { y++; m = 1; } else if (m < 1) { y--; m = 12; }
    setCurrentJalali([y, m, d]);
  };

  const persianMonths = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
  const days = generateDays();
  const years = generateYears();

  return (
    <div className={`jalali-date-picker ${inline ? 'is-inline' : ''} ${className}`} ref={calendarRef}>
      {!inline && (
        <div className="date-input-container" onClick={() => !disabled && setIsOpen(!isOpen)}>
          <input type="text" value={selectedDate ? toFaDigit(selectedDate) : ""} placeholder={placeholder} readOnly disabled={disabled} className="date-input" />
          <div className="date-icons">
            {selectedDate && showClearButton && <FaTimes className="clear-icon" onClick={handleClear} />}
            <FaCalendarAlt className="calendar-icon" />
          </div>
        </div>
      )}

      {(isOpen || inline) && !disabled && (
        <div className={`calendar-popup ${inline ? 'inline-popup shadow-none border-none p-0 w-full' : ''}`}>
          <div className="calendar-header">
            <div className="current-date-display">
              <div className="month-year-selector">
                <button className="nav-button" onClick={() => changeMonth(-1)}>‹</button>
                <span className={`year-selector ${viewMode === "year" ? "active" : ""}`} onClick={() => setViewMode("year")}>
                  {toFaDigit(currentJalali[0])}
                </span>
                <span className={`month-selector ${viewMode === "month" ? "active" : ""}`} onClick={() => setViewMode("month")}>
                  {persianMonths[currentJalali[1] - 1]}
                </span>
                <button className="nav-button" onClick={() => changeMonth(1)}>›</button>
              </div>
            </div>
          </div>

          {viewMode === "calendar" && (
            <>
              <div className="calendar-grid">
                {days.map((day, index) => (
                  <div
                    key={index}
                    className={`calendar-cell ${
                      day.type === "header" ? "calendar-header-cell" : day.type === "empty" ? "calendar-empty-cell"
                        : `calendar-day-cell ${day.isSelected ? "selected" : ""} ${day.isToday ? "today" : ""} ${day.is31DayMonth ? "month-31" : "month-30"} ${day.isDisabled ? "disabled" : ""}`
                    }`}
                    onClick={() => day.type === "day" && !day.isDisabled && handleDateSelect(day.date)}
                  >
                    {day.type === "header" && day.label}
                    {day.type === "day" && toFaDigit(day.day)}
                  </div>
                ))}
              </div>
              <div className="calendar-footer">
                {showTodayButton && (
                  <button
                    className="today-button"
                    onClick={() => {
                      const today = getCurrentJalaliDate();
                      setCurrentJalali(today);
                      handleDateSelect(formatDate(...today));
                    }}
                  >
                    امروز
                  </button>
                )}
                {!inline && <button className="confirm-button" onClick={() => setIsOpen(false)}>تایید</button>}
              </div>
            </>
          )}

          {viewMode === "year" && (
            <>
              <div className="year-month-grid">
                {years.map((year) => (
                  <div key={year} className={`year-cell ${year === currentJalali[0] ? "current-year" : ""}`} onClick={() => handleYearSelect(year)}>
                    {toFaDigit(year)}
                  </div>
                ))}
              </div>
              <div className="calendar-footer"><button className="back-button" onClick={() => setViewMode("calendar")}>بازگشت</button></div>
            </>
          )}

          {viewMode === "month" && (
            <>
              <div className="year-month-grid">
                {persianMonths.map((month, index) => (
                  <div key={index} className={`month-cell ${index + 1 === currentJalali[1] ? "current-month" : ""}`} onClick={() => handleMonthSelect(index + 1)}>
                    {month}
                  </div>
                ))}
              </div>
              <div className="calendar-footer"><button className="back-button" onClick={() => setViewMode("calendar")}>بازگشت</button></div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default JalaliDatePicker;
