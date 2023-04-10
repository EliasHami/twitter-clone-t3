import { type GetStaticProps, type NextPage } from 'next';
import Head from 'next/head';
import { api } from '~/utils/api';

const ProfilePage: NextPage<{ username: string }> = ({ username }) => {
  const { data } = api.profile.getUserByUsername.useQuery({
    username
  });

  if (!data) return <div>404</div>
  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <main className="flex justify-center h-screen">
        <div>{data.username}</div>
      </main>
    </>
  );
};


import { createServerSideHelpers } from '@trpc/react-query/server';
import { appRouter } from '~/server/api/root';
import SuperJSON from 'superjson';
import { prisma } from '~/server/db';

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma, userId: null },
    transformer: SuperJSON, // optional - adds superjson serialization
  });
  const slug = context.params?.slug;
  if (typeof slug !== 'string') throw new Error('no slug');

  const username = slug.replace("@", "");

  await ssg.profile.getUserByUsername.prefetch({ username })

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username
    }

  }
}

export const getStaticPaths = () => {
  return {
    paths: [], fallback: "blocking"
  }
}

export default ProfilePage;
