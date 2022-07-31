import type { Joke } from '@prisma/client';
import type { LoaderFunction, MetaFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { json } from '@remix-run/node';
import { db } from '~/utils/db.server';

type LoaderData = {
  joke: Pick<Joke, 'name' | 'content'>;
};

export const meta: MetaFunction = () => {
  return {};
};

export const loader: LoaderFunction = async ({ params }) => {
  const joke = await db.joke.findUnique({
    where: { id: params.jokeId },
  });

  if (!joke) throw new Error('Joke not found');
  const data: LoaderData = { joke };
  return json(data);
};

const JokePage = () => {
  const { joke } = useLoaderData<LoaderData>();
  return (
    <div>
      <p>Here's a joke:</p>
      <p>{joke.content}</p>
      <Link to='.'>"{joke.name}" permalink</Link>
    </div>
  );
};

export default JokePage;
