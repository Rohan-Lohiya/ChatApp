'use client';
import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import styles from './selectedchatsinfo.module.css';
import { useSelector } from 'react-redux';
import Image from 'next/image';
import Fuse from 'fuse.js';
import AddGroupMembers from './AddGroupMembers';
import axios from 'axios';
import { useTheme } from 'next-themes';

const SelectedChatsInfo = ({ setShowAbout, setdeletechatpressed }) => {
  const isgroupselected = useSelector(state => state.selectedUser?.isgroupselected ?? false);
  const selectedgoogleID = useSelector(state => state.selectedUser?.googleID);
  const groupdata = useSelector(state => state.selectedUser?.groupdata ?? []);
  const friends = useSelector(state => state.selectedUser?.totalPeople ?? []);
  const mygoogleID = useSelector(state => state.selectedUser?.mygoogleID);
  const token = useSelector(state => state.selectedUser.token);

  const [friendname, setfriendname] = useState('');
  const [about, setabout] = useState('');
  const [SearchTerm, setSearchTerm] = useState('');
  const [searchResult, setsearchResult] = useState([]);
  const [addmemberpressed, setaddmemberpressed] = useState(false);
  const [leaveGrouppressed, setleaveGrouppressed] = useState(false);
  const [selectedmember, setselectedmember] = useState('');
  const [alloweditdescription, setalloweditdescription] = useState(false);
  const [descriptionbtndisabled, setdescriptionbtndisabled] = useState(false);
  const addmemberref = useRef(null);
  const leavegroupref = useRef(null);
  const inputrefdescription = useRef(null);
  // Create refs for each member's dropdown - this is the key fix
  const memberOptionRefs = useRef({});
  const { theme } = useTheme();

  const fuseOptions = {
    includeScore: true,
    keys: ['name', 'GoogleID'],
  };

  const selectedgroupmembers = useMemo(() => {
    if (!isgroupselected) return [];
    const group = groupdata.find(group => group.groupID === selectedgoogleID);
    if (!group) return [];

    const adminIDs = group.groupAdmin.map(admin => admin.GoogleID);
    const admins = group.members.filter(member => adminIDs.includes(member.GoogleID));
    const nonAdmins = group.members.filter(
      member => !adminIDs.includes(member.GoogleID) && member.GoogleID !== mygoogleID
    );
    const me = group.members.find(member => member.GoogleID === mygoogleID);

    return [...(me ? [me] : []), ...admins.filter(m => m.GoogleID !== mygoogleID), ...nonAdmins];
  }, [isgroupselected, selectedgoogleID, groupdata, mygoogleID]);

  const memberscount = useMemo(() => {
    return selectedgroupmembers.filter(m => m.present).length;
  }, [selectedgroupmembers]);

  const checkAdmin = useCallback(
    GoogleID => {
      const group = groupdata.find(group => group.groupID === selectedgoogleID);
      return group?.groupAdmin?.some(admin => admin.GoogleID === GoogleID) ?? false;
    },
    [groupdata, selectedgoogleID]
  );

  const imagesrc = useMemo(() => {
    if (isgroupselected) {
      const group = groupdata.find(group => group.groupID === selectedgoogleID);
      return group?.groupImage ?? '/addchat.png';
    } else {
      const user = friends.find(person => person.GoogleID === selectedgoogleID);
      return user?.image ?? '/addchat.png';
    }
  }, [isgroupselected, selectedgoogleID, groupdata, friends]);

  useEffect(() => {
    const fuse = new Fuse(selectedgroupmembers, fuseOptions);
    const result = fuse.search(SearchTerm);
    setsearchResult(result.map(item => item.item));
  }, [SearchTerm, selectedgroupmembers]);

  useEffect(() => {
    if (isgroupselected) {
      const group = groupdata.find(group => group.groupID === selectedgoogleID);
      if (group) {
        setabout(group.description ?? 'No description');
        setfriendname(group.groupName ?? '');
      }
    } else {
      const user = friends.find(person => person.GoogleID === selectedgoogleID);
      if (user) {
        setabout(user.about ?? 'No about');
        setfriendname(user.name ?? '');
      }
    }
  }, [isgroupselected, selectedgoogleID, groupdata, friends]);

  useEffect(() => {
    const handleClickOutside = event => {
      // Check if click is outside any member option dropdown
      const isClickOutsideAnyMemberOption = Object.values(memberOptionRefs.current).every(
        ref => !ref || !ref.contains(event.target)
      );

      const isClickOutsideleaveOption = !leavegroupref.current || !leavegroupref.current.contains(event.target);

      if (
        addmemberref.current &&
        !addmemberref.current.contains(event.target) &&
        isClickOutsideAnyMemberOption &&
        isClickOutsideleaveOption
      ) {
        setaddmemberpressed(false);
        setselectedmember('');
        setleaveGrouppressed(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlesearchtoadd = useCallback(e => {
    setSearchTerm(e.target.value);
  }, []);

  const handleAddMembers = useCallback(() => {
    setaddmemberpressed(prev => !prev);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setsearchResult([]);
  }, []);

  const handlearrowclick = GoogleID => {
    selectedmember === GoogleID ? setselectedmember('') : setselectedmember(GoogleID);
  };

  const handleMakeAdmin = async GoogleID => {
    console.log('make admin clicked');
    if (isgroupselected) {
      const group = groupdata.find(group => group.groupID === selectedgoogleID);
      if (group) {
        if (group.groupAdmin.some(admin => admin.GoogleID === GoogleID)) {
          alert(GoogleID + ' is Already is admin');
          return;
        }
        try {
          const response = await axios.post(
            'http://localhost:5000/group/addadmin',
            {
              groupID: selectedgoogleID,
              newAdmin: GoogleID,
            },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );
          console.log(response.data);
          alert(GoogleID + ' is promoted successfully!');
          // Close the dropdown after successful action
          setselectedmember('');
        } catch (error) {
          console.error('Error making admin:', error);
          alert('An error occurred while making admin.');
        }
      }
    }
  };

  const handleRemoveMember = async GoogleID => {
    console.log('Remove member pressed');

    if (!isgroupselected) {
      alert('No group selected.');
      return;
    }

    const group = groupdata.find(group => group.groupID === selectedgoogleID);

    if (!group) {
      alert('Group not found.');
      return;
    }

    const isMember = group.members.some(member => member.GoogleID === GoogleID);

    if (!isMember) {
      alert(`${GoogleID} is already removed or not a member.`);
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/group/remove-member',
        {
          groupID: selectedgoogleID,
          member: GoogleID,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(response.data);
      alert(`${GoogleID} has been removed successfully!`);
      // Close the dropdown after successful action
      setselectedmember('');
    } catch (error) {
      console.error('Error removing member:', error);
      alert('An error occurred while removing the member.');
    }
  };

  const handleLeaveGroup = async () => {
    console.log('leave group presed');
    const res = await fetch('http://localhost:5000/group/leavegroup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // Securely pass token
      },
      body: JSON.stringify({
        groupID: selectedgoogleID, // ✅ Changed key name to match backend expectation
      }),
    });

    if (!res.ok) {
      const text = await res.text(); // read raw response
      throw new Error(`Request failed: ${res.status} ${text}`);
    }

    const data = await res.json(); // only parse if OK
    setleaveGrouppressed(false);
    setShowAbout(false);
    console.log(data);
  };

  const handlegroupdescChange = e => {
    setabout(e.target.value);
  };

  const handleDescEditClick = async () => {
    if (descriptionbtndisabled) return; // Prevent multiple clicks
    if (!isgroupselected) {
      alert('No group selected.');
      return;
    }
    if (alloweditdescription) {
      // Save the about info to the server
      setdescriptionbtndisabled(true); // Disable button to prevent multiple clicks
      try {
        const response = await axios.post(
          'http://localhost:5000/group/changedescription',
          { groupID: selectedgoogleID, description: about },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log('description updated:', response.data);
      } catch (error) {
        console.error('Error updating description:', error);
      }
    }
    setdescriptionbtndisabled(false); // Re-enable button after operation
    setalloweditdescription(!alloweditdescription);
    setTimeout(() => {
      inputrefdescription.current?.focus();
    }, 0);
  };

  // Helper function to render member row with dropdown
  const renderMemberRow = item => (
    <div key={item.GoogleID} className={styles.peoplelist}>
      <Image className={styles.peoplelistimage} src={item.imageURL} height={50} width={50} alt="Profile" />
      <div className={styles.peoplelistinfocont}>
        <div className={styles.peoplelistnamecont}>
          <div className={styles.peoplelistname}>{item.GoogleID === mygoogleID ? 'You' : item.name}</div>
          {checkAdmin(item.GoogleID) && <div className={styles.checkadmin}>Admin</div>}
        </div>
        <div className={styles.aboutcont}>
          <div className={styles.peoplelistabout}>{item.about}</div>
          {checkAdmin(mygoogleID) && item.GoogleID !== mygoogleID && (
            <>
              <Image
                onClick={() => handlearrowclick(item.GoogleID)}
                src={'/arrow.png'}
                height={20}
                width={20}
                alt="arrow"
              />
              <div
                ref={el => {
                  if (el) {
                    memberOptionRefs.current[item.GoogleID] = el;
                  }
                }}
                className={`${styles.memberoptions} ${
                  selectedmember === item.GoogleID ? styles.showoption : styles.hideoption
                }`}>
                <div onClick={() => handleRemoveMember(item.GoogleID)}>Remove</div>
                <div onClick={() => handleMakeAdmin(item.GoogleID)}>Make group admin</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.selectedchatinfocont}>
      <div className={`${styles.whitescreen} ${addmemberpressed ? styles.showwhite : styles.hidewhite}`}>
        <div
          ref={addmemberref}
          className={`${styles.addedmemberscont} ${addmemberpressed ? styles.showaddmem : styles.hideaddmem}`}>
          <AddGroupMembers setaddmemberpressed={setaddmemberpressed} />
        </div>
      </div>
      <div className={`${styles.whitescreen} ${leaveGrouppressed ? styles.showwhite : styles.hidewhite}`}>
        <div
          ref={leavegroupref}
          className={`${styles.leavegrouppromtcont} ${
            leaveGrouppressed ? styles.showleavegroup : styles.hideleavegroup
          }`}>
          <h2>Confirm leave this group?</h2>
          <h5>{`group will be removed from list (cannot be undone)`}</h5>
          <div className={styles.leaveoptioncont}>
            <div className={styles.leaveoptioncancel} onClick={() => setleaveGrouppressed(false)}>
              Cancel
            </div>
            <div className={styles.leaveoptionleave} onClick={handleLeaveGroup}>
              Leave group
            </div>
          </div>
        </div>
      </div>
      <div className={styles.heading}>
        <Image onClick={() => setShowAbout(false)} src={'/closelight.png'} width={40} height={40} alt="Close" />
        <h3>{isgroupselected ? 'Group info' : 'Contact info'}</h3>
      </div>
      <div className={styles.selectedimage}>
        <Image src={imagesrc} height={100} width={100} alt="profilePic" />
        <h3>{friendname}</h3>
      </div>
      <div className={styles.aboutsectioncont}>
        <h4>{isgroupselected ? 'Description' : 'About'}</h4>
        {isgroupselected && checkAdmin(mygoogleID) ? (
          <div className={styles.editdesccont}>
            <textarea
              className={styles.editdesctextarea}
              ref={inputrefdescription}
              readOnly={!alloweditdescription}
              onChange={e => {
                handlegroupdescChange(e);
                // Auto-resize logic
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              type="text"
              value={about}
              onFocus={e => {
                if (!alloweditdescription) e.target.blur();
              }}
              style={{ height: '24px' }} // Initial height setting
            />
            <Image
              onClick={handleDescEditClick}
              src={
                !alloweditdescription
                  ? `/edit${theme === 'light' ? '' : 'light'}.png`
                  : `/check${theme === 'light' ? '' : 'light'}.png`
              }
              height={20}
              width={20}
              alt="edit"></Image>
          </div>
        ) : (
          <div>{about}</div>
        )}
      </div>
      {isgroupselected && (
        <div className={styles.memberscont}>
          <h5>{`${memberscount} members`}</h5>
          {checkAdmin(mygoogleID) && (
            <div className={styles.addmembercont} onClick={handleAddMembers}>
              <Image src={'/addchatcolored.png'} height={30} width={30} alt="Add member" />
              <div>Add members</div>
            </div>
          )}
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
                onClick={clearSearch}
                src={'/closelight.png'}
                height={30}
                width={30}
                alt="Close"
              />
            </span>
          </div>
          {SearchTerm && (
            <div className={styles.searchresultcont}>
              {searchResult.filter(item => item.present).length > 0 ? (
                searchResult.filter(item => item.present).map(item => renderMemberRow(item))
              ) : (
                <div className={styles.nosearchresult}>No result found</div>
              )}
            </div>
          )}

          {!SearchTerm && (
            <div className={styles.peoplelistcont}>
              {selectedgroupmembers.filter(item => item.present).map(item => renderMemberRow(item))}
            </div>
          )}
        </div>
      )}
      {!isgroupselected && (
        <button
          onClick={() => {
            setdeletechatpressed(true);
            setShowAbout(false);
          }}
          className={styles.deletechatcont}>
          Delete Chat
        </button>
      )}
      {isgroupselected && (
        <button onClick={() => setleaveGrouppressed(true)} className={styles.deletechatcont}>
          Leave Group
        </button>
      )}
    </div>
  );
};

export default SelectedChatsInfo;
