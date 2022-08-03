import type { Joke } from '@prisma/client';
import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useCatch, useLoaderData, useParams } from '@remix-run/react';
import { json } from '@remix-run/node';
import { db } from '~/utils/db.server';
import { getUserId, requireUserId } from '~/utils/session.server';
import { JokeDisplay } from '../components/joke';

export const action: ActionFunction = async ({ request, params }) => {
  const form = await request.formData();
  if (form.get('_method') !== 'delete') {
    throw new Response(`The _method ${form.get('_method')} is not supported`, {
      status: 400,
    });
  }
  const userId = await requireUserId(request);
  const joke = await db.joke.findUnique({
    where: { id: params.jokeId },
  });
  if (!joke) {
    throw new Response("Can't delete what does not exist", {
      status: 404,
    });
  }
  if (joke.jokesterId !== userId) {
    throw new Response("Pssh, nice try. That's not your joke", {
      status: 401,
    });
  }
  await db.joke.delete({ where: { id: params.jokeId } });
  return redirect('/jokes');
};

type LoaderData = {
  joke: Pick<Joke, 'name' | 'content' | 'jokesterId'>;
  isOwner: boolean;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await getUserId(request);

  const joke = await db.joke.findUnique({
    where: { id: params.jokeId },
  });

  if (!joke) {
    throw new Response('What a joke! Not found.', {
      status: 404,
    });
  }

  const data: LoaderData = {
    joke,
    isOwner: userId === joke.jokesterId,
  };
  return json(data);
};

export const meta: MetaFunction = ({
  data,
}: {
  data: LoaderData | undefined;
}) => {
  if (!data) {
    return {
      title: 'No joke found',
      description: "Sorry, I'm not joking.",
    };
  }

  return {
    title: `${data.joke.name ?? '404'} | Remix Jokes`,
    description: `${data.joke.content}`,
  };
};

const JokePage = () => {
  const { joke, isOwner } = useLoaderData<LoaderData>();

  return <JokeDisplay joke={joke} isOwner={isOwner} />;
};

export const CatchBoundary = () => {
  const caught = useCatch();
  const { jokeId } = useParams();
  switch (caught.status) {
    case 400: {
      return (
        <div className='error-container'>
          What you're trying to do is not allowed.
        </div>
      );
    }
    case 404: {
      return (
        <div className='error-container'>
          Sorry, but the joke by the id of{' '}
          <code className='code-container'>{jokeId}</code> doesn't exist.
        </div>
      );
    }
    case 401: {
      return (
        <div className='error-container'>
          Sorry, but {jokeId} is not your joke.
        </div>
      );
    }
    default: {
      throw new Error(`Unhandled error: ${caught.status}`);
    }
  }
};

export function ErrorBoundary() {
  const { jokeId } = useParams();
  return (
    <div className='error-container'>
      Sorry, but the joke by the id of{' '}
      <code className='code-container'>{jokeId}</code> doesn't exist.
    </div>
  );
}

export default JokePage;
