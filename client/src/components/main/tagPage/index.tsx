import React from 'react';
import './index.css';
import TagView from './tag';
import useTagPage from '../../../hooks/useTagPage';
import AskQuestionButton from '../askQuestionButton';

/**
 * Represents the TagPage component which displays a list of tags
 * and provides functionality to handle tag clicks and ask a new question.
 */
const TagPage = () => {
  const { tlist, clickTag } = useTagPage();

  return (
    <>
      <div className='tags-header'>
        <div className='total_tags'>
          {tlist.length} {tlist.length === 1 ? 'Tag' : 'Tags'}
        </div>
        <AskQuestionButton />
      </div>
      <div className='tags-title'>All Tags</div>
      <div className='tag_list'>
        {tlist.map(t => (
          <TagView key={t.name} t={t} clickTag={clickTag} />
        ))}
      </div>
    </>
  );
};

export default TagPage;
