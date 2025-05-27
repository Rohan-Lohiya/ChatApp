"use client";
import React from "react";
import styles from "./addgroupmembers.module.css";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import Fuse from "fuse.js";
import Image from "next/image";

const AddGroupMembers = ({ setaddmemberpressed }) => {
  const selectedGoogleID = useSelector((state) => state.selectedUser.googleID);
  const groupdata = useSelector((state) => state.selectedUser.groupdata);
  const mygoogleID = useSelector((state) => state.selectedUser.mygoogleID);
  const totalpeople = useSelector((state) => state.selectedUser.totalPeople);
  const token = useSelector((state) => state.selectedUser.token);
  const isgroupselected = useSelector(
    (state) => state.selectedUser.isgroupselected
  );
  const [addedmembers, setaddedmembers] = useState([]);
  const [selectedgroup, setselectedgroup] = useState([]);
  const [selectedgroupmembers, setselectedgroupmembers] = useState([]);
  const [SearchTerm, setSearchTerm] = useState("");
  const [searchResult, setsearchResult] = useState("");

  const fuseOptions = {
    // isCaseSensitive: false,
    includeScore: true,
    // ignoreDiacritics: false,
    // shouldSort: true,
    // includeMatches: false,
    // findAllMatches: false,
    // minMatchCharLength: 1,
    // location: 0,
    // threshold: 0.6,
    // distance: 100,
    // useExtendedSearch: false,
    // ignoreLocation: false,
    // ignoreFieldNorm: false,
    // fieldNormWeight: 1,
    keys: ["name", "GoogleID"],
  };

  const fuse = new Fuse(totalpeople, fuseOptions);
  const result = fuse.search(SearchTerm);

  const handlesearchtoadd = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setsearchResult(result);
    console.log(result);
  };
  const isAlreadyInGroup = (GoogleID) => {
  return selectedgroup && selectedgroup.members
    ? selectedgroup.members.some((member) => member.GoogleID === GoogleID && member.present === true)
    : false;
};

const isNewlyAdded = (GoogleID) => {
  return addedmembers.some((member) => member.GoogleID === GoogleID);
};

  const handleCheckboxChange = ({ GoogleID, name, about, image }) => {
    // input is checked then add otherwise remove
    const addingmember = {
      GoogleID: GoogleID,
      name: name,
      about: about,
      imageURL: image,
    };
    setaddedmembers((prev) => {
      // If already added, remove; else, add
      const exists = prev.some((member) => member.GoogleID === GoogleID);
      if (exists) {
        return prev.filter((member) => member.GoogleID !== GoogleID);
      } else {
        return [...prev, addingmember];
      }
    });
  };

  const handleAddmembers = async () => {
    if(addedmembers.length == 0){
        alert("Add members first!");
        return;
    }
    try {
    const response = await axios.post('http://localhost:5000/group/add-member', {
      groupID: selectedGoogleID,
      members: addedmembers,  // Should be an array of member IDs/emails
    }, {
      headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`, // ✅ Use session token directly
            },
    });

    console.log(response.data);
    alert("Members added successfully!");
    setaddedmembers([]);
    setaddmemberpressed(false);


  } catch (error) {
    console.error('Error adding group member:', error);
    throw error;  // Re-throw the error for the calling function to handle
  }
  }

  useEffect(() => {
    const setgroupdata = () => {
      if (isgroupselected) {
        const group = groupdata.find(
          (group) => group.groupID === selectedGoogleID
        );
        if (group) {
          setselectedgroup(group);
        }
      }
    };
    setgroupdata();
  }, [selectedGoogleID, groupdata]);

  return (
    <div className={styles.maincont}>
      <div className={styles.heading}>Add Members</div>
      <div className={styles.searchmemberinputcont}>
        <input
          className={styles.searchinput}
          onChange={handlesearchtoadd}
          type="text"
          value={SearchTerm}
          placeholder="Search"
        />
        <span className={styles.closeimagecont}>
          <Image
            className={`${SearchTerm ? styles.show : styles.hide}`}
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
      </div>
      {!SearchTerm && (
        <div className={styles.peoplelistcont}>
          {totalpeople.map((item) => {
            return (
              <React.Fragment key={item.GoogleID}>
                <div className={styles.peoplelist}>
                  <Image
                    className={styles.peoplelistimage}
                    src={item.image}
                    height={50}
                    width={50}
                    alt="Profile"
                  ></Image>
                  <div className={styles.peoplelistinfocont}>
                    <div className={styles.peoplelistnamecont}>
                      <div className={styles.peoplelistname}>{item.name}</div>
                    </div>
                    <div className={styles.peoplelistabout}>
                      {isAlreadyInGroup(item.GoogleID) ? "Already added" : ""}
                    </div>
                  </div>
                  <div className={styles.peoplecheckcont}>
                    <input
                      className={styles["ui-checkbox"]}
                      type="checkbox"
                      checked={isNewlyAdded(item.GoogleID)}
                      onChange={() =>
                        handleCheckboxChange({
                          GoogleID: item.GoogleID,
                          name: item.name,
                          about: item.about,
                          image: item.image,
                        })
                      }
                      disabled={isAlreadyInGroup(item.GoogleID)}
                    />
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
      {SearchTerm && (
            <div className={styles.searchresultcont}>
              {searchResult.length > 0 ? (
                searchResult.map((item) => (
                  <div key={item.item.GoogleID} className={styles.searchresult}>
                    <Image
                      className={styles.searchresultimage}
                      src={item.item.image}
                      height={50}
                      width={50}
                      alt="Profile"
                    />
                    <div className={styles.peoplelistinfocont}>
                    <div className={styles.peoplelistnamecont}>
                      <div className={styles.peoplelistname}>{item.item.name}</div>
                    </div>
                    <div className={styles.peoplelistabout}>
                      {isAlreadyInGroup(item.item.GoogleID) ? "Already added" : ""}
                    </div>
                  </div>
                  <div className={styles.peoplecheckcont}>
                    <input
                      className={styles["ui-checkbox"]}
                      type="checkbox"
                      checked={isNewlyAdded(item.item.GoogleID)}
                      onChange={() =>
                        handleCheckboxChange({
                          GoogleID: item.item.GoogleID,
                          name: item.item.name,
                          about: item.item.about,
                          image: item.item.image,
                        })
                      }
                      disabled={isAlreadyInGroup(item.item.GoogleID)}
                    />
                  </div>
                  </div>
                ))
              ) : (
                <div className={styles.nosearchresult}>No result found</div>
              )}
            </div>
          )}
          <button className={styles.addmemberbtn} disabled={addedmembers.length == 0} onClick={handleAddmembers}>Add</button>
    </div>
  );
};

export default AddGroupMembers;
