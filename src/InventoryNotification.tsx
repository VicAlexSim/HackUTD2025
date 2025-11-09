import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiPackage, FiCheck, FiX } from "react-icons/fi";

interface InventoryOrder {
  partNumber: string;
  partName: string;
  quantity: number;
  currentStock: number;
}

interface InventoryNotificationProps {
  order: InventoryOrder | null;
  onClose: () => void;
}

export default function InventoryNotification({ order, onClose }: InventoryNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (order) {
      setIsVisible(true);
      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for fade-out animation
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [order, onClose]);

  if (!order) return null;

  const notificationContent = (
    <div
      className={`fixed bottom-4 left-4 z-[9999] transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="bg-black/90 backdrop-blur-xl p-4 min-w-[350px] max-w-md shadow-2xl border-2 border-blue-500/50 rounded-xl">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <FiPackage className="w-5 h-5 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FiCheck className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Order Placed</h3>
            </div>
            
            <p className="text-xs text-gray-300 mb-2">
              Successfully ordered via voice command
            </p>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Part Number:</span>
                <span className="text-white font-mono">{order.partNumber}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Part Name:</span>
                <span className="text-white truncate ml-2">{order.partName}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Quantity Ordered:</span>
                <span className="text-blue-400 font-semibold">{order.quantity} units</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Current Stock:</span>
                <span className={`font-semibold ${
                  order.currentStock === 0 ? "text-red-400" :
                  order.currentStock <= 3 ? "text-yellow-400" :
                  "text-blue-400"
                }`}>
                  {order.currentStock} units
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-blue-500/30">
              <div className="flex items-center gap-1.5 text-xs text-blue-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                <span>Status: On Order</span>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-blue-500/20 flex items-center justify-center transition-colors"
          >
            <FiX className="w-4 h-4 text-gray-400 hover:text-blue-400" />
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render at document body level, ensuring it's always in bottom-left corner
  if (typeof document !== 'undefined') {
    return createPortal(notificationContent, document.body);
  }
  
  return null;
}

