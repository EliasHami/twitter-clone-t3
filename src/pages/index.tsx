import { type NextPage } from 'next';
import { SignInButton, useUser } from '@clerk/nextjs';
import { api } from "~/utils/api";

import Image from 'next/image';
import { LoadingPage, LoadingSpinner } from '~/components/Loading';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { PageLayout } from '~/components/layout';
import PostView from '~/components/PostView';


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
