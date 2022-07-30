import type { LinksFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';
import styles from '~/styles/index.css';

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: styles }];
};

const Home = () => {
  return (
    <div className='container'>
      <div className='content'>
        <h1>
          Remix <span>Jokes!</span>
        </h1>
        <nav>
          <ul>
            <li>
              <Link to='jokes'>Read Jokes</Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Home;
