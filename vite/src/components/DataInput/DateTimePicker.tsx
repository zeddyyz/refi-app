import firebase from "firebase/app";
import moment from "moment";
import React, { ReactElement } from "react";
import * as DatetimeModule from "react-datetime";
const Datetime =
  process.env.NODE_ENV === "production"
    ? (DatetimeModule as any).default.default
    : (DatetimeModule as any).default;
import "./DateTimePicker.css";

interface IDateTimePickerProps {
  value: firebase.firestore.Timestamp;
  onChange: (newValue: firebase.firestore.Timestamp) => void;
}

const dateFormat = "MM/DD/YYYY";
const timeFormat = "HH:mm:ss";
const format = `${dateFormat} ${timeFormat}`;

const DateTimePicker = ({
  value,
  onChange,
}: IDateTimePickerProps): ReactElement => {
  const handleOnClose = (event: string | Event | moment.Moment) => {
    if (moment.isMoment(event)) {
      if (
        moment(value.toDate()).format(format) !== moment(event).format(format)
      ) {
        onChange(firebase.firestore.Timestamp.fromDate(event.toDate()));
      }
    }
  };

  return (
    <Datetime
      closeOnSelect
      initialValue={value.toDate()}
      onClose={handleOnClose as any}
      dateFormat={dateFormat}
      timeFormat={timeFormat}
      className="h-full"
      inputProps={{
        className:
          "w-full h-full outline-none ring-inset focus:bg-accent p-1.5 border-0 focus:ring-0 text-sm text-foreground bg-transparent",
      }}
    />
  );
};

export default DateTimePicker;
