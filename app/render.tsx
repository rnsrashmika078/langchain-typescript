import React from "react";

const Render = () => {
  const arr = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];
  let newArray: string[] = [];
  if (arr.length > 5) {
    const trim = arr.slice(1, arr.length);
    newArray = trim;
  }
  return <div>{newArray}</div>;
};

export default Render;
