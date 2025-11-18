import { useState, useMemo } from 'react';
import { type User, type Post } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Map, ShoppingBag, Plus, Settings, MessageSquare, BarChart2, Edit, Trash, Eye } from 'lucide-react';
import { GoogleMap, MarkerF, InfoWindowF } from '@react-google-maps/api';

interface DashboardProps {
  user: User;
  onNavigate: (page: string) => void;
  posts: Post[];
  allPosts: Post[];
  onViewDetail: (postId: string) => void;
  onEdit: (postId: string) => void;
  onDelete: (postId: string) => void;
  onChat: (postId: string) => void;
  isLoaded: boolean;
  loadError: Error | undefined;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem'
};

const defaultCenter = {
  lat: 18.7883, // Chiang Mai
  lng: 98.9853
};

export function Dashboard({
  user,
  onNavigate,
  posts,
  allPosts,
  onViewDetail,
  onEdit,
  onDelete,
  onChat,
  isLoaded,
  loadError,
}: DashboardProps) {
  const [selectedMarker, setSelectedMarker] = useState<Post | null>(null);

  // กรองโพสต์ที่มี location ถูกต้อง
  const postsWithCoords = useMemo(() => {
    return allPosts.filter(post => post.location && typeof post.location.lat === 'number' && typeof post.location.lng === 'number');
  }, [allPosts]);

  const renderMap = () => {
    if (loadError) return <div className="text-red-500">Error loading maps. Please check your API key.</div>;
    if (!isLoaded) return <div>Loading map...</div>;

    return (
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={12}
      >
        {postsWithCoords.map((post) => (
          <MarkerF
            key={post.id}
            position={post.location}
            onClick={() => setSelectedMarker(post)}
          />
        ))}

        {selectedMarker && (
          <InfoWindowF
            position={selectedMarker.location}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2 max-w-xs">
              <h4 className="font-bold text-sm mb-1">{selectedMarker.title}</h4>
              <p className="text-xs mb-1">{selectedMarker.address}</p>
              <p className="text-xs mb-2 font-semibold">{selectedMarker.price} บาท / {selectedMarker.unit}</p>
              <Button size="xs" onClick={() => onViewDetail(selectedMarker.id)}>ดูรายละเอียด</Button>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">ยินดีต้อนรับ, {user.name}</h1>
      <p className="text-lg text-gray-600 mb-8">นี่คือภาพรวมระบบของคุณ</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <ActionButton icon={ShoppingBag} label="ตลาด" onClick={() => onNavigate('marketplace')} />
        <ActionButton icon={Plus} label="สร้างโพสต์" onClick={() => onNavigate('create-post')} />
        <ActionButton icon={MessageSquare} label="แชท" onClick={() => onNavigate('chat')} />
        <ActionButton icon={Map} label="แผนที่" onClick={() => onNavigate('circular-view')} />
        <ActionButton icon={Settings} label="โปรไฟล์" onClick={() => onNavigate('profile')} />
      </div>

      {/* Google Map Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Map className="w-5 h-5 mr-2" />
            แผนที่โพสต์ทั้งหมด
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderMap()}
        </CardContent>
      </Card>
      
      {/* My Posts Section */}
      <Card>
        <CardHeader>
          <CardTitle>โพสต์ของฉัน</CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-gray-500">คุณยังไม่มีโพสต์</p>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <div key={post.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold">{post.title}</h3>
                    <p className="text-sm text-gray-600">{post.price} บาท / {post.unit} ({post.address})</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => onViewDetail(post.id)}><Eye className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => onEdit(post.id)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(post.id)}><Trash className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

const ActionButton = ({ icon: Icon, label, onClick }: { icon: React.ElementType, label: string, onClick: () => void }) => (
  <Button variant="outline" className="flex flex-col h-24 items-center justify-center space-y-2" onClick={onClick}>
    <Icon className="w-6 h-6" />
    <span>{label}</span>
  </Button>
);