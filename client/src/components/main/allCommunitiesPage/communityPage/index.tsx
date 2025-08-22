import './index.css';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CommunityGroupChat from '../chats/index';
import Leaderboard from '../gameLeaderBoard';
import { Community } from '../../../../types/types';
import { getCommunityByName } from '../../../../services/communitygroupService';
import CommunitySettingsButton from '../communitySettingsButton';
import CommunityPolls from '../polls';

/**
 * Represents the CommunitiesPage component which displays details of a selected community.
 */
const IndividualCommunitiesPage = () => {
  const { name } = useParams<{ name: string }>();
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

  /**
   * Retrieves the community details.
   */
  useEffect(() => {
    const fetchCommunity = async () => {
      if (!name) return;
      try {
        const response = await getCommunityByName(name);
        if ('error' in response) {
          setSelectedCommunity(null);
        } else {
          setSelectedCommunity(response as Community);
        }
      } catch (fetchError) {
        // console.error('Failed to fetch community details', fetchError);
      }
    };

    fetchCommunity();
  }, [name]);

  return (
    <div className='communities-page'>
      <div className='community-details'>
        {selectedCommunity && (
          <>
            <div className='community-header'>
              <div className='header-left'>
                <h2 className='selected-comm-name'>{selectedCommunity.name}</h2>
                <p>{selectedCommunity.description}</p>
              </div>
              <div className='header-right'>
                <p>
                  <strong>Members:</strong> {selectedCommunity.members.length}
                </p>
              </div>
            </div>
            <div className='community-content'>
              <div className='top-row'>
                {selectedCommunity.pollsEnabled && (
                  <div className='polls-column'>
                    <CommunityPolls name={selectedCommunity?.name || ''} />
                  </div>
                )}
                {selectedCommunity.leaderboardEnabled && (
                  <div className='leaderboard-column'>
                    <Leaderboard communityName={selectedCommunity?.name || ''} />
                  </div>
                )}
              </div>
              <div className='bottom-row'>
                <CommunityGroupChat name={selectedCommunity.name} />
              </div>
            </div>
          </>
        )}{' '}
        {selectedCommunity && <CommunitySettingsButton {...selectedCommunity} />}
      </div>
    </div>
  );
};

export default IndividualCommunitiesPage;
