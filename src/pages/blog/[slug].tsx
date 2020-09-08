import React, { useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import { EditorState, convertFromRaw } from 'draft-js';
import createToolbarPlugin from 'draft-js-static-toolbar-plugin';
import TopBanner from 'src/component/TopBanner.tsx';
import { capitalize } from 'src/utils/capitalize';
import moment from 'moment';
import createLinkDecorator from 'src/component/Editor/Decorators';
import Editor from 'draft-js-plugins-editor';
import useGetComments from '../../hooks/useGetComments';
import useCreateComment from 'src/hooks/useCreateComment';
import Face from 'src/component/Face';
import useFollowUser from 'src/hooks/useFollowUser';
import useUnfollowUser from 'src/hooks/useUnfollowUser';
import { BsFillHeartFill } from 'react-icons/bs';
import PostLike from 'src/component/PostLike';
import usePostLike from 'src/hooks/usePostLike';
import usePostUnLike from 'src/hooks/usePostUnLike';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'src/store/rootReducer';
import { PostGet } from 'src/store/post';
import useDeletePost from 'src/hooks/useDeletePost';
import CommentForm from 'src/component/forms/CommentForm';
import useGetPosts from 'src/hooks/useGetPosts';
import { initializeApollo } from 'src/lib/apollo';
import CommentsItem from 'src/component/forms/CommentsItem';
import useDeleteComment from 'src/hooks/useDeleteComment';
import useEditComment from 'src/hooks/useEditComment';

import Buttons from 'src/component/common/Button';
import Comments from 'src/component/Comments/Comments';
import SubComments from 'src/component/Comments/SubComments';

const PostPageTap = styled.div`
  .post-wrapper {
    width: 40%;
    margin: 0 auto;
    padding: 6rem;
  }
  .card-wrapper {
    width: 50%;
    right: 0;
    margin: 0 auto;
    position: absolute;
  }
  .like-button-wrapper {
    position: absolute;
    left: 20%;
    margin-top: 8%;
  }
  .sticky-wrapper {
    position: sticky;
    top: 0;
  }
  .comments-count {
    margin: 1rem;
  }
  .dataFormat {
    border-bottom: 2px solid transparent;
    border-top: 2px solid transparent;
    font-size: 1rem;
    line-height: 1.5;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.04em !important;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial,
      sans-serif;
    color: rgba(38, 38, 38, 0.66);
  }
  .intro-wrapper {
    margin: 1rem 0;
  }
  .comments-wrapper {
    width: 40%;
    margin: 0 auto;
    padding: 6rem;
  }

  .comments-text-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .comments-edit {
    display: flex;
    & div {
      margin-right: 1rem;
    }
  }

  .comments-layout {
    text-align: left;
    color: rgb(52, 58, 64);
    margin: auto;
    padding: 1rem;
    outline: none;
    border-width: 1px;
    border-style: solid;
    border-color: rgb(233, 236, 239);
    border-image: initial;
    border-radius: 4px;
  }
  .comments-text {
    padding-top: 1rem;
  }

  .comment-write-button {
    display: flex;
    justify-content: space-between;
    color: rgb(134, 142, 150);
  }

  .commentsInput {
    margin-bottom: 1.5rem;
    width: 95%;
    font-size: 1rem;
    color: rgb(33, 37, 41);
    line-height: 1.75;
    padding: 1rem 1rem 1.5rem;
    outline: none;
    border-width: 1px;
    border-style: solid;
    border-color: rgb(233, 236, 239);
    border-image: initial;
    border-radius: 4px;
  }

  .button-flex {
    display: flex;
    justify-content: flex-end;
    width: 100%;
    margin-bottom: 1rem;
  }

  .subcomments-wrapper {
    margin: 0.5rem;
    display: flex;
    justify-content: flex-end;
    flex-wrap: nowrap;
  }

  .comments-edit-wrapper {
    display: flex;
    justify-content: flex-end;

    & div {
      margin-right: 0.4rem;
    }
  }
  .edit-button {
    display: flex;
    & div {
      margin-right: 0.4rem;
    }
  }
`;
const Title = styled.div`
  max-width: 780px;
  font-size: 48px;
  margin-bottom: 25px;
  font-weight: 800;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial,
    sans-serif;
  letter-spacing: -0.022em;
  line-height: 1.35;
  margin-block-start: 0.83em;
  margin-block-end: 0.83em;
`;

const styleMap = {
  CODE: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 4,
  },
  BOLD: {
    color: '#395296',
    fontWeight: 'bold',
  },
  ANYCUSTOMSTYLE: {
    color: '#00e400',
  },
  FANCYBLOCKQUOTE: {
    color: '#999',
    fontStyle: 'italic',
    fontFamily: `'Hoefler Text', Georgia, serif`,
    display: 'flex',
    justifyContent: 'center',
  },
  H1: {
    fontSize: '2rem',
  },
  H2: {
    fontSize: '1.5rem',
  },
  H3: {
    fontSize: '1.7rem',
  },
};

export type PostPageProps = {};

function PostPage(props: PostPageProps) {
  const dispatch = useDispatch();
  const [isInput, setisInput] = useState(false);
  const post = useSelector((state: RootState) => state.post);
  const { loading, error: getError, data } = useGetPosts();
  const { commentsLoading, commentsError, commentstData } = useGetComments();
  const {
    textOnChange,
    subTextOnChange,
    handleSubmit,
    subHandleSubmit,
    getText,
    getSubText,
    isOpen,
    setIsopen,
  } = useCreateComment();
  const { followHandleSubmit, error, BooleanIsFollowing } = useFollowUser();
  const { unFollowHandleSubmit, unfollowError } = useUnfollowUser();
  const [on, toggle] = useState(false);
  const { LikehandleSubmit, isLikeBoolean } = usePostLike();
  const { UnlikehandleSubmit, isUnLikeBoolean } = usePostUnLike();
  const { DeletePostSubmit } = useDeletePost();
  const { EditCommentSubmit } = useEditComment();
  const { DeleteCommentSubmit } = useDeleteComment();
  const [editComment, setEditComment] = useState(false);

  const [editText, setEditText] = useState('');
  const [subEditText, subSetEditText] = useState('');

  const router = useRouter();

  if (getError) return <p>zzzzzzzzzzz</p>;
  if (loading) return <p>loading</p>;

  if (commentsLoading) return <p>Loading...</p>;
  if (commentsError) return <p>Error !!!!!!!!!!:(</p>;

  const findData = data.posts.find(ele => ele.id == router.query.slug);
  const staticToolbarPlugin = createToolbarPlugin();

  const DBEditorState = convertFromRaw(JSON.parse(findData.body ? findData.body : ''));
  const bodyData = EditorState.createWithContent(DBEditorState);
  const decorator = createLinkDecorator();

  const defaultEditorState = EditorState.createWithContent(
    convertFromRaw(JSON.parse(findData.body)),
    decorator,
  );

  const getComments = commentstData.comment.filter(el => el.post_id == router.query.slug);

  const username = findData.user.username;
  const findId = findData.id;

  const getPostData = () => {
    dispatch(PostGet(findData));
  };

  const editCommentInput = e => {
    setEditText(e.target.value);
  };

  const editSubCommentInput = e => {
    subSetEditText(e.target.value);
  };

  const fixComment = () => {
    setEditComment(!editComment);
  };

  return (
    <>
      <PostPageTap>
        <TopBanner />
        <div className="sticky-wrapper">
          <div className="like-button-wrapper">
            <PostLike
              LikehandleSubmit={LikehandleSubmit}
              isLikeBoolean={isLikeBoolean}
              UnlikehandleSubmit={UnlikehandleSubmit}
            />
          </div>
        </div>
        <div className="sticky-wrapper">
          <div className="card-wrapper">
            <Face
              username={username}
              followHandleSubmit={followHandleSubmit}
              error={error}
              unFollowHandleSubmit={unFollowHandleSubmit}
              unfollowError={unfollowError}
              BooleanIsFollowing={BooleanIsFollowing}
            />
          </div>
        </div>
        <div className="post-wrapper">
          <Title> {capitalize(findData.title)}</Title>
          <div className="tag">{findData.tag}</div>
          <div className="dataFormat">
            {moment(findData.created_at).format('MMMM Do YYYY, h:mm:ss a')}
          </div>
          <div className="intro-wrapper">
            <Editor editorState={defaultEditorState} readonly customStyleMap={styleMap} />
          </div>
        </div>
        <div className="comments-wrapper">
          <div className="comments-text-wrapper">
            <div className="comments-count">{getComments.length} 개의 댓글</div>
            <div className="comments-edit">
              <Link href={`/write/${findId}`}>
                <div onClick={getPostData}>
                  <a>수정</a>
                </div>
              </Link>
              <div onClick={e => DeletePostSubmit(e, findId)}>삭제</div>
            </div>
          </div>
          <CommentForm
            findId={findId}
            handleSubmit={handleSubmit}
            getText={getText}
            textOnChange={textOnChange}
          />
          {/* {getComments.map((el, id) => (
            <div key={id}>
              <CommentsItem
                el={el}
                ele={el}
                isInput={isInput}
                getSubText={getSubText}
                subTextOnChange={subTextOnChange}
                setIsopen={setIsopen}
                toggle={toggle}
                on={on}
                isOpen={isOpen}
                subHandleSubmit={subHandleSubmit}
                findData={findData}
                EditCommentSubmit={EditCommentSubmit}
                findId={findId}
                setisInput={setisInput}
                DeleteCommentSubmit={DeleteCommentSubmit}
              />
            </div>
          ))} */}

          {getComments.map((el, id) => (
            <>
              <div key={id}>
                <Comments
                  el={el}
                  editComment={editComment}
                  editText={editText}
                  editCommentInput={editCommentInput}
                  toggle={toggle}
                  on={on}
                  EditCommentSubmit={EditCommentSubmit}
                  fixComment={fixComment}
                  DeleteCommentSubmit={DeleteCommentSubmit}
                  setIsopen={setIsopen}
                />
              </div>

              {el.id == isOpen && on ? (
                <>
                  <form onSubmit={e => subHandleSubmit(e, findData.id)}>
                    <input
                      className="commentsInput"
                      placeholder="댓글을 입력하세요"
                      name="text"
                      value={getSubText}
                      type="text"
                      onChange={subTextOnChange}
                    />
                    <div className="button-flex">
                      <Buttons color="blue" size={24} iconBefore="edit">
                        댓글 작성
                      </Buttons>
                    </div>
                  </form>
                </>
              ) : (
                ''
              )}
              {getComments.map((ele, id) => (
                <>
                  <SubComments
                    ele={ele}
                    el={el}
                    subEditText={subEditText}
                    editSubCommentInput={editSubCommentInput}
                    EditCommentSubmit={EditCommentSubmit}
                    DeleteCommentSubmit={DeleteCommentSubmit}
                  />
                </>
              ))}
            </>
          ))}
        </div>
      </PostPageTap>
    </>
  );
}

export default PostPage;
