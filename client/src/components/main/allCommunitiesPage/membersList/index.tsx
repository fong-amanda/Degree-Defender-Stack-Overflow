import React from 'react';

interface MembersListProps {
  members: string[];
}
/**
 * DirectMessage component renders a page for direct messaging between users.
 * It includes a list of users and a chat window to send and receive messages.
 */
const MembersList = ({ members }: MembersListProps): JSX.Element => (
  <div>
    <h3>Members</h3>
    <ul>
      {members.map((member, index) => (
        <li key={index}>{member}</li>
      ))}
    </ul>
  </div>
);
export default MembersList;
