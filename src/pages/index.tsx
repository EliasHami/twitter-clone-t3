import { type NextPage } from 'next';
import { SignInButton, useUser } from '@clerk/nextjs';
import { type RouterOutputs, api } from "~/utils/api";

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Image from 'next/image';
import { LoadingPage, LoadingSpinner } from '~/components/Loading';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { PageLayout } from '~/components/layout';

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();
  const [input, setInput] = useState<string>('');

  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput('');
      void ctx.posts.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage && errorMessage[0]) return toast.error(errorMessage[0])
      else {
        toast.error("Failed to post! Please try again later.")
      }
    }
  });

  if (!user) return null;

  console.log(user)

  return <div className='flex w-full gap-3'>
    <Image src={user.profileImageUrl} alt='Profile image' className='rounded-full w-14 h-14'
      width={56}
      height={56} />
    <input placeholder='Type some emojis!' className='bg-transparent outline-none grow'
      type="text"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      disabled={isPosting}
      onKeyDown={(e) => {
        e.preventDefault();
        if (input !== "") {
          mutate({ content: input });
        }
      }}
    />
    {input !== "" && !isPosting && (
      <button onClick={() => mutate({ content: input })}>Post</button>
    )}
    {isPosting && <div className='flex justify-center items-center'>
      <LoadingSpinner size={20} />
    </div>}
  </div>
}

type PostWithUser = RouterOutputs["posts"]["getAll"][number]

const PostView = (props: PostWithUser) => {
  const { post, author } = props;
  return (
    <div key={post.id} className="flex gap-3 p-4 border-b border-slate-400">
      <Image src={author.profileImageUrl} className='rounded-full w-14 h-14'
        alt={`@${author.username} profile picture`}
        width={56}
        height={56}
      />
      <div className="flex flex-col">
        <div className="flex gap-1 text-slate-300">
          <Link href={`/@${author.username}`}>
            <span>{`@${author.username}`}</span>
          </Link>
          <Link href={`/post/${post.id}`}>
            <span className="font-thin">{` · ${dayjs(post.createdAt).fromNow()}`}</span>
          </Link>
        </div>
        <span className='text-2xl'>{post.content}</span>
      </div>
    </div>
  )
}

const Feed = () => {
  const { data, isLoading } = api.posts.getAll.useQuery(); // uses cached data from Home

  if (isLoading) return <LoadingPage />
  if (!data) return <div>Something went wrong</div>

  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
}

const Home: NextPage = () => {
  const { isLoaded: userLoaded, isSignedIn } = useUser();
  // Start fetching asap
  api.posts.getAll.useQuery();

  // Return empty div if isn't loaded
  if (!userLoaded) return <div />

  return (
    <PageLayout>
      <div className="flex p-4 border-b border-slate-400">
        {!isSignedIn && <div className="flex justify-center">
          <SignInButton />
        </div>}
        {!!isSignedIn && <CreatePostWizard />}
      </div>
      <Feed />
    </PageLayout>
  );
};

export default Home;
