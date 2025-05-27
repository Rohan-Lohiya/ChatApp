import React from "react";
import styles from "./searchinput.module.css";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import Fuse from "fuse.js";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { setSelectedGoogleID, setisgroupselected } from "@/app/store/selectedUserSlice";
const Searchinput = () => {
  const poeple = useSelector((state) => state.selectedUser.totalPeople);
  const groupdata = useSelector((state) => state.selectedUser.groupdata);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setsearchResult] = useState([]);
  const dispatch = useDispatch();

   const combinedData = [
    ...poeple.map((person) => ({ ...person, type: "person" })),
    ...groupdata.map((group) => ({
      ...group,
      name: group.groupName,
      GoogleID: group.groupID, // temporary for common key
      image: group.groupImage,
      type: "group",
    })),
  ];

  const fuseOptions = {
    includeScore: true,
    keys: ["name", "GoogleID"],
  };

  const fuse = new Fuse(combinedData, fuseOptions);
  const result = fuse.search(searchTerm);
  const handlechange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setsearchResult(result);
  };
  const handleserchClick = (item) => {
    setSearchTerm("");
    setsearchResult([]);

    if (item.type === "person") {
      dispatch(setisgroupselected(false));
      dispatch(setSelectedGoogleID(item.GoogleID));
    } else if (item.type === "group") {
      dispatch(setisgroupselected(true));
      dispatch(setSelectedGoogleID(item.groupID)); // fallback if groups use same logic
    }
  };

  return (
    <div className={styles.searchinputcontainer}>
      <input
        className={styles.searchinput}
        onChange={handlechange}
        type="text"
        value={searchTerm}
        placeholder="Search"
      />
      <span className={styles.closeimagecont}>
        <Image
          className={`${searchTerm ? styles.show : styles.hide}`}
          onClick={() => {
            setSearchTerm("");
            setsearchResult("");
          }}
          src={"/closelight.png"}
          height={30}
          width={30}
          alt="Close"
        ></Image>
      </span>
      {searchTerm && (
        <div className={styles.searchresultcont}>
          {searchResult.map((item) => {
            return (
              <React.Fragment key={item.item.GoogleID}>
                <div className={styles.searchresult} onClick={() => handleserchClick(item.item)}>
                  <Image
                    className={styles.searchresultimage}
                    src={item.item.image}
                    height={50}
                    width={50}
                    alt="Profile"
                  ></Image>
                  <div className={styles.searchresultname}>
                    {item.item.name}
                  </div>
                </div>
                <hr className={styles.linebreak} />
              </React.Fragment>
            );
          })}
          {searchResult.length === 0 && (
            <div className={styles.nosearchresult}>No result found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Searchinput;
