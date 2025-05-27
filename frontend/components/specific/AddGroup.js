import React from "react";
import { useState } from "react";
import styles from "./addgroup.module.css";
import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import Fuse from "fuse.js";
import { setaddgroup } from "@/app/store/selectedUserSlice";
import axios from "axios";

const AddGroup = ({setaddgrouppressed}) => {
  const [groupimagesrc, setgroupimagesrc] = useState("/groupprofile.png");
  const [imagesource, setimagesource] = useState("");
  const [groupname, setgroupname] = useState("");
  const [groupdescription, setgroupdescription] = useState("");
  const totatlpeople = useSelector((state) => state.selectedUser.totalPeople);
  const myprofileimage = useSelector(
    (state) => state.selectedUser.myprofileimage
  );
  const mygoogleID = useSelector((state) => state.selectedUser.mygoogleID);
  const myname = useSelector((state) => state.selectedUser.myname);
  const about = useSelector((state) => state.selectedUser.about);
  const [searchResult, setsearchResult] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [groupmembers, setgroupmembers] = useState([
    {
      GoogleID: mygoogleID,
      name: myname,
      imageURL: myprofileimage,
      about: about,
    },
  ]);
  const [groupAdmin, setgroupAdmin] = useState([{
    GoogleID: mygoogleID,
      name: myname,
      image: myprofileimage,
  }])
    const dispatch = useDispatch();
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

  const fuse = new Fuse(totatlpeople, fuseOptions);
  const result = fuse.search(searchTerm);
  const handlesearchtoadd = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setsearchResult(result);
    console.log(result);
  };

  const handlegroupname = (e) => {
    setgroupname(e.target.value);
  };
  const handlegroudescription = (e) => {
    setgroupdescription(e.target.value);
  };
  const handleaddpeople = (GoogleID) => {
    setSearchTerm("");
    setsearchResult("");
    const selectedUser = totatlpeople.find(
      (item) => item.GoogleID === GoogleID
    );
    const alreadyAdded = groupmembers.some(
      (item) => item.GoogleID === GoogleID
    );
    const member = {
      GoogleID: selectedUser.GoogleID,
      imageURL: selectedUser.image,
      name: selectedUser.name,
      about: selectedUser.about,
    }
    if (alreadyAdded) {
      alert("User already added");
      return;
    }
    if (selectedUser) {
      setgroupmembers((prevMembers) => {
        const updated = [...prevMembers, member];
        console.log("Selected User:", updated);
        return updated;
      });
    }
  };
  const removepeople = (GoogleID) => {
    const updatedMembers = groupmembers.filter(
      (item) => item.GoogleID !== GoogleID
    );
    setgroupmembers(updatedMembers);
  };
  const handlechangeimage = (e) => {
    if (e.target.value === "mine") {
      console.log(myprofileimage);
      setimagesource(myprofileimage);
    } else {
      setimagesource(e.target.value);
    }
  };
  const handleverifyimage = () => {
    if (imagesource.trim() === "") {
      alert("Image URL is empty, using default image");
      setgroupimagesrc("/groupprofile.png");
      return;
    }

    const testImg = new window.Image(); // ✅ Use browser's Image constructor
    testImg.onload = () => {
      setgroupimagesrc(imagesource); // Valid image
    };
    testImg.onerror = () => {
      alert("Invalid image URL");
    };
    testImg.src = imagesource;
  };
  const handlecreategroup = () => {
    const newgroup = {
        groupName: groupname,
        groupImage: groupimagesrc,
        members: groupmembers,
        groupAdmin: groupAdmin,
        description: groupdescription,
    };
    if(!groupimagesrc || !groupname || groupmembers.length < 2 ){
        alert("Missing feids");
        return;
    }
    const fetchData = async () => {
      try {
        const response = await axios.post(
          "http://localhost:5000/group/creategroup",
          newgroup
        );
        console.log("Group created successfully:", response.data);
       setaddgrouppressed(false);
      } catch (error) {
        console.error("Error creating group:", error);
      }
    }
    fetchData();
  };

  return (
    <div className={styles.addGroupContainer}>
      <div className={styles.firstcolumn}>
        <h2 className={styles.addgroupheading}>Create Group</h2>
        <div className={styles.groupimgcont}>
          <Image
            className={styles.groupimage}
            src={groupimagesrc}
            height={100}
            width={100}
            alt="groupImage"
          ></Image>
        </div>
        <input
          className={styles.groupnameinput}
          onChange={handlegroupname}
          type="text"
          value={groupname}
          placeholder="Group Name"
        />
        <textarea
          className={styles.groupdescriptioninput}
          onChange={handlegroudescription}
          type="text"
          value={groupdescription}
          placeholder="Group description"
        />
        <textarea
          className={styles.imagesourceinput}
          onChange={handlechangeimage}
          type="text"
          value={imagesource}
          placeholder="Add image URL or type 'mine' to use your profile image"
        />
        <button className={styles.verifybtn} onClick={handleverifyimage}>
          {imagesource.trim() === "" ? "Use Default Image" : "Verify Image"}
        </button>
        {groupmembers.length > 1 && (
          <div className={styles.addedpeoplecont}>
            {groupmembers.map((item) => {
              return (
                <React.Fragment key={item.GoogleID}>
                  {item.GoogleID !== mygoogleID && (
                    <div className={styles.addedpeople}>
                      <Image
                        className={styles.addedpeopleimage}
                        src={item.imageURL}
                        height={20}
                        width={20}
                        alt="Profile"
                      ></Image>
                      <div className={styles.addedpeoplename}>{item.name}</div>
                      <Image
                        className={styles.removepeopleimg}
                        src={"/closelight.png"}
                        height={20}
                        width={20}
                        alt="cancel"
                        onClick={() => removepeople(item.GoogleID)}
                      ></Image>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
        {groupmembers.length == 1 && (
          <div className={styles.addedpeopleheadingcont}>
            Added people will list here
          </div>
        )}
      </div>
      <div className={styles.secondcolumn}>
        <div className={styles.addgroupmemberscont}>
          <input
            className={styles.searchinput}
            onChange={handlesearchtoadd}
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
        </div>
        {searchTerm && (
          <div className={styles.searchresultcont}>
            {searchResult.map((item) => {
              return (
                <React.Fragment key={item.item.GoogleID}>
                  <div
                    className={styles.searchresult}
                    onClick={() => handleaddpeople(item.item.GoogleID)}
                  >
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
        {!searchTerm && (
          <div className={styles.peoplelistcont}>
            {totatlpeople.map((item) => {
              return (
                <React.Fragment key={item.GoogleID}>
                  <div
                    className={styles.peoplelist}
                    onClick={() => handleaddpeople(item.GoogleID)}
                  >
                    <Image
                      className={styles.peoplelistimage}
                      src={item.image}
                      height={50}
                      width={50}
                      alt="Profile"
                    ></Image>
                    <div className={styles.peoplelistname}>{item.name}</div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
        <button onClick={handlecreategroup} className={styles.verifybtn}>
          Create Group
        </button>
      </div>
    </div>
  );
};

export default AddGroup;
